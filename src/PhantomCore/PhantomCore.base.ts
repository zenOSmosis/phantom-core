// @see https://github.com/YuzuJS/setImmediate
// Exposes setImmediate as a global, if not already defined as a global
import "setimmediate";

import CommonEventEmitter from "../CommonEventEmitter";
import Logger, { LogIntersection, LOG_LEVEL_INFO } from "../Logger";
import logger from "../globalLogger";
import DestructibleEventEmitter, {
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
} from "../_DestructibleEventEmitter";
import getPackageJSON from "../utils/getPackageJSON";
import FunctionStack, {
  FUNCTION_STACK_OPS_ORDER_LIFO,
} from "../stacks/FunctionStack";
import EventProxyStack from "../stacks/EventProxyStack";
import TimerStack from "../stacks/TimerStack";
import getClassName from "../utils/class-utils/getClassName";
import { v4 as uuidv4 } from "uuid";
import shortUUID from "short-uuid";
import dayjs from "dayjs";
import getUnixTime from "../utils/getUnixTime";
import getClassInstancePropertyNames from "../utils/class-utils/getClassInstancePropertyNames";
import getClassInstanceMethodNames from "../utils/class-utils/getClassInstanceMethodNames";
import autoBindClassInstanceMethods from "../utils/class-utils/autoBindClassInstanceMethods";
import shallowMerge from "../utils/shallowMerge";
import { Class, ClassInstance } from "../utils/class-utils/types";
import { CommonOptions } from "./types";

// Number of milliseconds to allow async inits to initialize before triggering
// warning
const ASYNC_INIT_GRACE_TIME = 5000;

/**
 * @event EVT_NO_EMIT_WARN Emits when async mode is turned on and super _init
 * method is not called in a reasonable amount of time.
 */
export const EVT_NO_INIT_WARN = "no-init-warn";

/**
 * @event EVT_READY Emits when ready for consumption. This is generalized and
 * may have some exceptions in extension classes.
 */
export const EVT_READY = "ready";

/**
 * @event EVT_UPDATE Emits when something of common significance has updated
 * which any attached views should be aware of.
 */
export const EVT_UPDATE = "update";

export { EVT_BEFORE_DESTROY, EVT_DESTROY_STACK_TIME_OUT, EVT_DESTROY };

// Instances for this particular thread
//
// TODO: [3.0.0] Convert to map
const _instances: { [key: string]: PhantomCore } = {};

// Methods which should continue working after class destruct
const KEEP_ALIVE_SHUTDOWN_METHODS = [
  "log",
  "listenerCount",
  "getHasDestroyStarted",
  "getIsDestroyed",
  "getInstanceUptime",
  "getTotalListenerCount",
  //
  // PhantomCollection method names
  //
  "getChildren",
  //
  // super method names
  //
  "off",
  "removeListener",
  "eventNames",
  "listenerCount",
  //
  // patches for other packages:
  //
  // [project--media-stream-track-controller]
  // Fixes an issue w/ test runner locking up with
  // media-stream-track-controller's track controller collection when testing
  // for media stream tracks removed from _outputMediaStream property
  "getOutputMediaStreamTrack",
];

/**
 * Base class for zenOSmosis Phantom architecture, from which Speaker.app and
 * ReShell classes derive.
 */
export default class PhantomCore extends DestructibleEventEmitter {
  /**
   * Retrieves the version as defined in package.json.
   *
   * NOTE: As opposed to "getVersion" this longer naming is designed to reduce
   * disambiguation for extended classes which might have a different version
   * number.
   *
   * @return {string}
   */
  static getPhantomCoreVersion() {
    const { version } = getPackageJSON();

    return version;
  }

  /**
   * Determines whether or not the given instance is a PhantomCore instance,
   * matching the exact version of this PhantomCore class.
   */
  static getIsInstance(instance: PhantomCore | Class) {
    return instance instanceof PhantomCore;
  }

  /**
   * Determines whether or not the given instance is a PhantomCore instance,
   * matching any version of the PhantomCore library.
   *
   * IMPORTANT: This should only be used in situations where another library
   * may use a different version of PhantomCore internally. It does not
   * guarantee there will not be version conflicts, but may help situations
   * where updating PhantomCore itself requires updating other extension
   * libraries due to minor changes.
   */
  static getIsLooseInstance(instance: PhantomCore | Class) {
    return Boolean(
      instance instanceof CommonEventEmitter &&
        typeof instance.getIsDestroyed === "function" &&
        typeof instance.destroy === "function"
    );
  }

  /**
   * Retrieves PhantomCore instance with the given UUID.
   *
   * @param {string} uuid
   * @return {PhantomCore}
   */
  static getInstanceWithUUID(uuid: string) {
    return _instances[uuid];
  }

  /**
   * Symbol is a built-in object whose constructor returns a symbol primitive —
   * also called a Symbol value or just a Symbol — that’s guaranteed to be
   * unique. Symbols are often used to add unique property keys to an object
   * that won’t collide with keys any other code might add to the object, and
   * which are hidden from any mechanisms other code will typically use to
   * access the object. That enables a form of weak encapsulation, or a weak
   * form of information hiding.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol
   */
  static getInstanceWithSymbol(symbol: Symbol) {
    return Object.values(_instances).find(
      instance => instance.getSymbol() === symbol
    );
  }

  /**
   * Retrieves the number of instances for this thread.
   *
   * When an instance is created / destroyed, the number is increased / reduced
   * by one.
   */
  static getInstanceCount() {
    return Object.keys(_instances).length;
  }

  /**
   * Shallow-merges two objects together.
   *
   * IMPORTANT: The return is a COPY of the merged; no re-assignment takes place.
   */
  static mergeOptions(
    objA: { [key: string]: unknown } | null,
    objB: { [key: string]: unknown } | null
  ) {
    return shallowMerge(objA, objB);
  }

  protected _options: CommonOptions;

  protected _instanceStartTime: number;
  protected _isReady: boolean;
  protected _title: string | null;
  protected _eventProxyStack: EventProxyStack;
  protected _cleanupHandlerStack: FunctionStack;
  protected _timerStack: TimerStack;
  protected _uuid: string;
  protected _shortUUID: string;

  protected _symbol: Symbol | null;

  public log: LogIntersection;

  constructor(options: CommonOptions = {}) {
    super();

    this._uuid = uuidv4();
    this._shortUUID = shortUUID().fromUUID(this._uuid);

    _instances[this._uuid] = this;

    const DEFAULT_OPTIONS: CommonOptions = {
      /**
       * If set to true, this._init() MUST be called during the instance
       * construction, or shortly thereafter (otherwise a warning will be
       * raised).
       *
       * Note that if set to false, this._init will be discarded, regardless if
       * it was defined in an extension class.
       **/
      isAsync: false,

      logLevel: LOG_LEVEL_INFO,

      /**
       * An arbitrary Symbol for this instance, explicitly guaranteed to be
       * unique across instances.
       **/
      symbol: null,

      /**
       * An arbitrary title for this instance, not guaranteed to be unique
       * across instances.
       **/
      title: null,

      /**
       * Whether or not to automatically bind PhantomCore class methods to the
       * local PhantomCore class.
       */
      hasAutomaticBindings: true,
    };

    // Options should be considered immutable
    this._options = Object.freeze(
      PhantomCore.mergeOptions(DEFAULT_OPTIONS, options)
    );

    // Functions added to this stack are invoked in reverse so that the
    // shutdown handlers can be kept close to where relevant properties are
    // defined. Any subsequent properties and their own cleanup handlers which
    // depend on previously defined properties will destruct prior to their
    // dependencies.
    //
    // i.e.
    //
    //  _propA = new PhantomCore()
    //  this.registerCleanupHandler(() => _propA.destroy())
    //
    // _propB depends on propA, and we don't want to move the propA shutdown
    // handler beyond this point to keep it closer to where propA was defined
    this._cleanupHandlerStack = new FunctionStack(
      FUNCTION_STACK_OPS_ORDER_LIFO
    );

    this._symbol = (() => {
      if (this._options.symbol) {
        if (PhantomCore.getInstanceWithSymbol(this._options.symbol)) {
          throw new Error(
            "Existing instance with symbol",
            // TODO: [3.0.0] Remove ts-ignore
            // @ts-ignore
            this._options.symbol
          );
        }

        if (typeof this._options.symbol !== "symbol") {
          throw new TypeError("options.symbol is not a Symbol");
        }
      }

      return this._options.symbol;
    })() as symbol | null;

    this._title = this._options.title as string | null;

    this.logger = new Logger({
      logLevel: this._options.logLevel,

      /**
       * Currently using ISO8601 formatted date; for date rendering options:
       * @see https://day.js.org/docs/en/display/format
       */
      prefix: (strLogLevel: string) =>
        `[${dayjs().format()} ${strLogLevel} ${this.getClassName()} ${
          this._uuid
        }]`,
    });

    // FIXME: [3.0.0] Fix type so "as" isn't necessary
    this.registerCleanupHandler(() => (this.logger as Logger).destroy());

    /**
     * NOTE: This is called directly in order to not lose the stack trace.
     *
     * @type {Function} Calling this function directly will indirectly call
     * logger.info(); The logger.trace(), logger.debug(), logger.info(),
     * logger.warn(), and logger.error() properties can be called directly.
     */
    this.log = this.logger.log;

    this.once(EVT_DESTROY_STACK_TIME_OUT, () => {
      this.log.error(
        "The destruct callstack is taking longer to execute than expected. Ensure a potential gridlock situation is not happening, where two or more PhantomCore instances are awaiting one another to shut down."
      );
    });

    /** @type {number} UTC Unix time */
    this._instanceStartTime = getUnixTime();

    this._isReady = !this._options.isAsync || false;

    // Bound remote event handlers
    this._eventProxyStack = new EventProxyStack();
    this.registerCleanupHandler(async () => {
      await this._eventProxyStack.destroy();

      // Ignoring because we don't want this to be an optional property
      // during runtime
      // @ts-ignore
      this._eventProxyStack = null;
    });

    this._timerStack = new TimerStack();
    this.registerCleanupHandler(async () => {
      await this._timerStack.destroy();

      // Ignoring because we don't want this to be an optional property
      // during runtime
      // @ts-ignore
      this._timerStack = null;
    });

    // Force method scope binding to class instance
    if (this._options.hasAutomaticBindings) {
      this.autoBind();
    }

    if (this._isReady) {
      // This shouldn't be called if running isAsync
      //
      // Override init function
      this._init = () => {
        throw new Error("_init cannot be called in non-async mode");
      };

      // Allow synchronous queue to drain before emitting EVT_READY
      setImmediate(() => this.emit(EVT_READY));
    } else {
      // IMPORTANT: Implementations which set isAsync to true must call
      // PhantomCore superclass _init on their own

      // Warn if _init() is not invoked in a short time period
      const longRespondInitWarnTimeout = setTimeout(() => {
        this.logger.warn(
          "PhantomCore superclass _init has not been called in a reasonable amount of time. All instances which use isAsync option must call _init on the PhantomCore superclass."
        );

        this.emit(EVT_NO_INIT_WARN);
      }, ASYNC_INIT_GRACE_TIME);

      this.once(EVT_READY, () => clearTimeout(longRespondInitWarnTimeout));
      this.once(EVT_DESTROY, () => clearTimeout(longRespondInitWarnTimeout));
    }
  }

  /**
   * Internally invoked after being constructed.
   *
   * IMPORTANT: Extensions which set isReady to false should call this
   * manually.
   *
   * @return {Promise<void>}
   */
  async _init() {
    this._init = () => {
      throw new ReferenceError("_init cannot be called more than once");
    };

    // Await promise so that EVT_READY listeners can be invoked on next event
    // loop cycle
    await new Promise<void>((resolve, reject) => {
      if (!this.getIsDestroyed()) {
        this._isReady = true;
        this.emit(EVT_READY);
        resolve();
      } else {
        reject();
      }
    });
  }

  /**
   * Responder for instance.toString()
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toStringTag
   *
   * @return {string} i.e. "[object PhantomCore]"
   */
  get [Symbol.toStringTag]() {
    return this.getTitle() || this.getClassName();
  }

  /**
   * Force scope binding of PhantomCore class methods to the instance they are
   * defined in, regardless of how the method is invoked.
   *
   * IMPORTANT: Once a method is bound, it cannot be rebound to another class.
   * @see https://stackoverflow.com/a/20925268
   *
   * @return {void}
   */
  autoBind() {
    // TODO: Adding this.log to the ignore list may not be necessary if
    // auto-binding in the logger itself

    // Handling for this.log is special and needs to be passed directly from
    // the caller, or else it will lose the stack trace
    const IGNORE_LIST = [this.log];

    autoBindClassInstanceMethods(this, IGNORE_LIST);
  }

  /**
   * Registers a function with the cleanup handler stack, which is executed
   * after EVT_DESTROY is emit and all event handlers have been removed.
   */
  registerCleanupHandler(fn: Function) {
    return this._cleanupHandlerStack.push(fn);
  }

  /**
   * Unregisters a function from the cleanup handler stack.
   */
  unregisterCleanupHandler(fn: Function) {
    return this._cleanupHandlerStack.remove(fn);
  }

  /**
   * Retrieves the property names which are non-destructed PhantomCore
   * instances.
   *
   * @return {string[]}
   */
  getPhantomProperties() {
    return this.getPropertyNames().filter(
      propName =>
        propName !== "__proto__" &&
        PhantomCore.getIsInstance((this as ClassInstance)[propName]) &&
        !(this as ClassInstance)[propName].getIsDestroyed()
    );
  }

  /**
   * Retrieves the associated symbol to this PhantomCore instance.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol
   */
  getSymbol() {
    return this._symbol;
  }

  /**
   * Retrieves the PhantomCore instance title.
   */
  getTitle() {
    return this._title;
  }

  /**
   * Sets the PhantomCore instance title.
   *
   * @emits EVT_UPDATE
   */
  setTitle(title: string) {
    this._title = title;

    this.emit(EVT_UPDATE);
  }

  /**
   * Retrieves the options utilized in the class constructor.
   */
  getOptions() {
    return this._options;
  }

  /**
   * Retrieve the option with the given name, if exists.
   */
  getOption(optionName: string) {
    // TODO: [3.0.0] Fix type
    // @ts-ignore
    return this._options[optionName];
  }

  /**
   * Sets the log level, in order to determine log filtering.
   *
   * Accepts either numeric (i.e. LOG_LEVEL_TRACE constant) or string (i.e.
   * "trace") values.
   */
  setLogLevel(level: number | string) {
    // FIXME: [3.0.0] Fix type so "as" isn't necessary
    (this.logger as Logger).setLogLevel(level);
  }

  /**
   * Retrieves the current log level (as a number).
   */
  getLogLevel() {
    // FIXME: [3.0.0] Fix type so "as" isn't necessary
    return (this.logger as Logger).getLogLevel();
  }

  /**
   * Retrieves all properties registered to this class.
   *
   * NOTE: It doesn't return properties defined via symbols.
   *
   * @see https://stackoverflow.com/a/31055217
   */
  getPropertyNames() {
    return getClassInstancePropertyNames(this);
  }

  /**
   * Retrieves all methods registered to this class.
   *
   * NOTE: It doesn't return methods defined via symbols.
   */
  getMethodNames() {
    return getClassInstanceMethodNames(this);
  }

  /**
   * Resolves once the class instance is ready.
   */
  async onceReady() {
    if (this._isReady) {
      return;
    }

    return new Promise(resolve => this.once(EVT_READY, resolve));
  }

  /**
   * Retrieves whether or not the class instance is ready.
   */
  getIsReady() {
    return this._isReady;
  }

  /**
   * The unique identifier which represents this class instance.
   */
  getUUID() {
    return this._uuid;
  }

  /**
   * The short unique identifier which represents this class instance.
   *
   * i.e. "mhvXdrZT4jP5T8vBxuvm75"
   */
  getShortUUID() {
    return this._shortUUID;
  }

  /**
   * Determines whether the passed instance is the same as the current
   * instance.
   */
  getIsSameInstance(instance: PhantomCore | Class) {
    return Object.is(this, instance);
  }

  /**
   * Retrieves the non-instantiated class definition.
   */
  getClass() {
    return this.constructor;
  }

  /**
   * IMPORTANT: This is not safe to rely on and will be modified if the script
   * is minified.
   */
  getClassName() {
    return getClassName(this);
  }

  /**
   * Binds an "on" event listener to another PhantomCore instance.
   *
   * This should not be confused with JavaScript object proxies and is not
   * intended to work the same way.
   *
   * NOTE: Unlike the original event emitter method, this does NOT return a
   * reference to the underlying class for optional chaining, and it currently
   * does NOT support the optional "options" argument.
   *
   * @see {@link https://nodejs.org/api/events.html#eventsonemitter-eventname-options}
   */
  proxyOn(
    targetInstance: PhantomCore,
    eventName: string | symbol,
    eventHandler: (...args: any[]) => void
  ) {
    if (!PhantomCore.getIsLooseInstance(targetInstance)) {
      throw new ReferenceError("targetInstance is not a PhantomCore instance");
    }

    if (this.getIsSameInstance(targetInstance)) {
      throw new ReferenceError("targetInstance cannot be bound to itself");
    }

    this._eventProxyStack.addProxyHandler(
      "on",
      targetInstance,
      eventName,
      eventHandler
    );
  }

  /**
   * Binds a "once" event listener to another PhantomCore instance.
   *
   * This should not be confused with JavaScript object proxies and is not
   * intended to work the same way.
   *
   * NOTE: Unlike the original event emitter method, this does NOT return a
   * reference to the underlying class for optional chaining, and it currently
   * does NOT support the optional "options" argument.
   *
   * @see {@link https://nodejs.org/api/events.html#eventsonceemitter-name-options}
   */
  proxyOnce(
    targetInstance: PhantomCore,
    eventName: string | symbol,
    eventHandler: (...args: any[]) => void
  ) {
    if (!PhantomCore.getIsLooseInstance(targetInstance)) {
      throw new ReferenceError("targetInstance is not a PhantomCore instance");
    }

    if (this.getIsSameInstance(targetInstance)) {
      throw new ReferenceError("targetInstance cannot be bound to itself");
    }

    this._eventProxyStack.addProxyHandler(
      "once",
      targetInstance,
      eventName,
      eventHandler
    );
  }

  /**
   * Unbinds an "on" or "once" event listener from another PhantomCore
   * instance.
   *
   * This should not be confused with JavaScript object proxies and is not
   * intended to work the same way.
   *
   * NOTE: Unlike the original event emitter method, this does NOT return a
   * reference to the underlying class for optional chaining.
   *
   * @see {@link https://nodejs.org/api/events.html#emitteroffeventname-listener}
   */
  proxyOff(
    targetInstance: PhantomCore,
    eventName: string | symbol,
    eventHandler: (...args: any[]) => void
  ) {
    if (!PhantomCore.getIsLooseInstance(targetInstance)) {
      throw new ReferenceError("targetInstance is not a PhantomCore instance");
    }

    if (this.getIsSameInstance(targetInstance)) {
      throw new ReferenceError("targetInstance cannot be bound to itself");
    }

    // Unbind the event handler from the proxy instance
    this._eventProxyStack.removeProxyHandler(
      targetInstance,
      eventName,
      eventHandler
    );
  }

  /**
   * Retrieves the number of seconds since this class instance was
   * instantiated.
   *
   * @return {number}
   */
  getInstanceUptime() {
    if (!this.getIsDestroyed()) {
      return getUnixTime() - this._instanceStartTime;
    } else {
      return 0;
    }
  }

  /**
   * Creates a timeout which is managed by this instance of PhantomCore.
   */
  setTimeout(fn: Function, delay = 0) {
    return this._timerStack.setTimeout(fn, delay);
  }

  /**
   * Clears the given timeout, if it is managed by this instance of
   * PhantomCore.
   */
  clearTimeout(timeoutID: ReturnType<typeof setTimeout>) {
    return this._timerStack.clearTimeout(timeoutID);
  }

  /**
   * Clears all timeouts managed by this instance of PhantomCore.
   */
  clearAllTimeouts() {
    return this._timerStack.clearAllTimeouts();
  }

  /**
   * Creates an interval which is managed by this instance of PhantomCore.
   */
  setInterval(fn: Function, delay = 0) {
    return this._timerStack.setInterval(fn, delay);
  }

  /**
   * Clears an interval which is managed by this instance of PhantomCore.
   */
  clearInterval(intervalID: ReturnType<typeof setInterval>) {
    return this._timerStack.clearInterval(intervalID);
  }

  /**
   * Clears all intervals managed by this instance of PhantomCore.
   */
  clearAllIntervals() {
    return this._timerStack.clearAllIntervals();
  }

  /**
   * Clears all timeouts and intervals managed by this instance of PhantomCore.
   */
  clearAllTimers() {
    return this._timerStack.clearAllTimers();
  }

  /**
   * NOTE: Order of operations for shutdown handling:
   *
   *  1. [implementation defined] destroyHandler
   *  2. EVT_DESTROY triggers
   *  3. registerCleanupHandler call stack
   */
  override async destroy(destroyHandler?: () => void) {
    return super.destroy(
      async () => {
        // Unregister from _instances
        delete _instances[this._uuid];

        if (typeof destroyHandler === "function") {
          await destroyHandler();
        }
      },
      async () => {
        await this._cleanupHandlerStack.exec();

        // TODO: Force regular class properties to be null (as of July 30, 2021,
        // not changing due to unforeseen consequences):
        // @see related issue: https://github.com/zenOSmosis/phantom-core/issues/34
        // @see potentially related issue: https://github.com/zenOSmosis/phantom-core/issues/100

        this.getPhantomProperties().forEach(phantomProp => {
          this.log.warn(
            `Lingering PhantomCore instance on prop name "${phantomProp}". This could be a memory leak. Ensure that all PhantomCore instances have been disposed of before class destruct.`
          );
        });

        const className = this.getClassName();

        for (const methodName of this.getMethodNames()) {
          // Force non-keep-alive methods to return undefined
          if (!KEEP_ALIVE_SHUTDOWN_METHODS.includes(methodName)) {
            // Override the class method
            (this as ClassInstance)[methodName] = (): void => {
              logger.warn(
                `${className}:${methodName} cannot be invoked after instance has been destructed`
              );

              // Explicitly return undefined here
              //
              // Double-assurance that we're overriding the class implementation
              return undefined;
            };
          }

          // TODO: Reimplement and conditionally silence w/ instance options
          // or env
          // this.logger.warn(
          //  `Cannot call this.${method}() after class ${className} is destroyed`
          // );
        }
      }
    );
  }
}
