import { Class, ClassInstance, RecursiveObject } from "../types";
import { CommonOptions } from "./types";
import CommonEventEmitter from "../CommonEventEmitter";
import DestructibleEventEmitter, {
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
} from "../_DestructibleEventEmitter";
import Logger, { LogIntersection, EVT_LOG_MISS } from "../Logger";
import logger from "../globalLogger";
import getPackageJSON from "../utils/getPackageJSON";
import FunctionStack, {
  FUNCTION_STACK_OPS_ORDER_LIFO,
} from "../stacks/FunctionStack";
import EventProxyStack, {
  EventProxyStackBindTypes,
} from "../stacks/EventProxyStack";
import TimerStack from "../stacks/TimerStack";
import getClassName from "../utils/class-utils/getClassName";
import { v4 as uuidv4 } from "uuid";
import shortUUID from "short-uuid";
import dayjs from "dayjs";
import getUnixTime from "../utils/getUnixTime";
import getClassInstancePropertyNames from "../utils/class-utils/getClassInstancePropertyNames";
import getClassInstanceMethodNames from "../utils/class-utils/getClassInstanceMethodNames";
import autoBindClassInstanceMethods from "../utils/class-utils/autoBindClassInstanceMethods";
import shallowMerge from "../utils/object-utils/shallowMerge";

import phantomCoreOrchestrator from "./_PhantomCoreOrchestrator";

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
   */
  static getPhantomCoreVersion(): string {
    const { version } = getPackageJSON();

    return version as string;
  }

  /**
   * Determines whether or not the given instance is a PhantomCore instance,
   * matching the exact version of this PhantomCore class.
   */
  static getIsInstance(instance: PhantomCore | Class): boolean {
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
  static getIsLooseInstance(instance: PhantomCore | Class): boolean {
    return Boolean(
      instance instanceof CommonEventEmitter &&
        typeof instance.getIsDestroyed === "function" &&
        typeof instance.destroy === "function"
    );
  }

  /**
   * Retrieves the total number of active PhantomCore instances running on this
   * CPU thread.
   *
   * When an instance is created / destroyed, the number is increased / reduced
   * by one.
   */
  static getInstanceCount(): number {
    return phantomCoreOrchestrator.getPhantomInstanceCount();
  }

  /**
   * Shallow-merges two objects together.
   *
   * IMPORTANT: The return is a COPY of the merged; no re-assignment takes place.
   */
  static mergeOptions(
    objA: RecursiveObject | null,
    objB: RecursiveObject | null
  ) {
    return shallowMerge(objA, objB);
  }

  protected _options: CommonOptions;

  protected _uuid: string = uuidv4();
  protected _shortUUID: string = shortUUID().fromUUID(this._uuid);
  protected _instanceStartTime: number = getUnixTime();
  protected _isReady: boolean = false;
  protected _title: string | null = null;
  protected _eventProxyStack: EventProxyStack;
  protected _cleanupHandlerStack: FunctionStack;
  protected _timerStack: TimerStack;

  constructor(options: CommonOptions = {}) {
    super(new Logger());

    // Note: PhantomWatcher will automatically handle instance de-registration
    phantomCoreOrchestrator.addInstance(this);

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

    this._title = this._options.title as string | null;

    (this.logger as Logger).setPrefix((strLogLevel: string) => {
      const className = this.getClassName();
      const title = this.getTitle();

      const classNameWithTitle = !title ? className : `${className}[${title}]`;

      return `[${dayjs().format()} ${strLogLevel} ${classNameWithTitle} ${
        this._uuid
      }]`;
    });

    // Proxies log misses
    (this.logger as Logger).on(EVT_LOG_MISS, logLevel =>
      this.emit(EVT_LOG_MISS, logLevel)
    );

    // FIXME: [3.0.0] Fix type so "as" isn't necessary
    this.registerCleanupHandler(() => (this.logger as Logger).destroy());

    this.once(EVT_DESTROY_STACK_TIME_OUT, () => {
      this.log.error(
        "The destruct callstack is taking longer to execute than expected. Ensure a potential gridlock situation is not happening, where two or more PhantomCore instances are awaiting one another to shut down."
      );
    });

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
      queueMicrotask(() => {
        if (!this.getHasDestroyStarted()) {
          this.emit(EVT_READY);
        }
      });
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

      this.once(EVT_READY, () => {
        clearTimeout(longRespondInitWarnTimeout);
      });

      this.once(EVT_DESTROY, () => {
        clearTimeout(longRespondInitWarnTimeout);
      });
    }

    this.once(EVT_READY, () => {
      this.log.debug("Ready for consumption");
    });
  }

  get log(): LogIntersection {
    /**
     * NOTE: This is called directly in order to not lose the stack trace.
     *
     * @type {Function} Calling this function directly will indirectly call
     * logger.info(); The logger.trace(), logger.debug(), logger.info(),
     * logger.warn(), and logger.error() properties can be called directly.
     */
    return (this.logger as Logger).log;
  }

  /**
   * Internally invoked after being constructed.
   *
   * IMPORTANT: Extensions which set isReady to false should call this
   * manually.
   */
  async _init(): Promise<void> {
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
   */
  get [Symbol.toStringTag](): string {
    return this.getTitle() || this.getClassName();
  }

  /**
   * Force scope binding of PhantomCore class methods to the instance they are
   * defined in, regardless of how the method is invoked.
   *
   * IMPORTANT: Once a method is bound, it cannot be rebound to another class.
   * @see https://stackoverflow.com/a/20925268
   */
  autoBind(): void {
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
  registerCleanupHandler(fn: Function): void {
    return this._cleanupHandlerStack.push(fn);
  }

  /**
   * Unregisters a function from the cleanup handler stack.
   */
  unregisterCleanupHandler(fn: Function): void {
    return this._cleanupHandlerStack.remove(fn);
  }

  /**
   * Retrieves the property names which are non-destructed PhantomCore
   * instances.
   */
  getPhantomProperties(): string[] {
    return this.getPropertyNames().filter(
      propName =>
        propName !== "__proto__" &&
        PhantomCore.getIsInstance((this as ClassInstance)[propName]) &&
        !(this as ClassInstance)[propName].getIsDestroyed()
    );
  }

  /**
   * Retrieves the PhantomCore instance title.
   */
  getTitle(): string | null {
    return this._title;
  }

  /**
   * Sets the PhantomCore instance title.
   *
   * @emits EVT_UPDATE
   */
  setTitle(title: string): void {
    this._title = title;

    this.emit(EVT_UPDATE);
  }

  /**
   * Retrieves the options utilized in the class constructor.
   */
  // TODO: [3.0.0] Use recursive object type & CommonOptions
  getOptions() {
    return this._options;
  }

  /**
   * Retrieve the option with the given name, if exists.
   */
  getOption(optionName: string): unknown {
    // TODO: [3.0.0] Fix type
    // @ts-ignore
    return this._options[optionName];
  }

  /**
   * Sets the log level, in order to determine log filtering.
   *
   * Accepts either numeric (i.e. LogLevel.Trace constant) or string (i.e.
   * "trace") values.
   */
  setLogLevel(logLevel: number | string): void {
    const prevLogLevel = this.getLogLevel();

    // FIXME: [3.0.0] Fix type so "as" isn't necessary
    (this.logger as Logger).setLogLevel(logLevel);

    const nextLogLevel = this.getLogLevel();

    if (prevLogLevel !== nextLogLevel) {
      this.log.debug(
        `Changed log level to: ${Logger.toStringLogLevel(logLevel)}`
      );
    }
  }

  /**
   * Retrieves the current log level (as a number).
   */
  getLogLevel(): number {
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
  getPropertyNames(): string[] {
    return getClassInstancePropertyNames(this);
  }

  /**
   * Retrieves all methods registered to this class.
   *
   * NOTE: It doesn't return methods defined via symbols.
   */
  getMethodNames(): string[] {
    return getClassInstanceMethodNames(this);
  }

  /**
   * Resolves once the class instance is ready.
   */
  // TODO: [3.0.0] Accept optional callback here: https://github.com/zenOSmosis/phantom-core/issues/109
  // TODO: [3.0.0] Reject if destructed before ready: https://github.com/zenOSmosis/phantom-core/issues/108
  async onceReady(): Promise<void> {
    if (this._isReady) {
      return;
    }

    return new Promise(resolve => this.once(EVT_READY, resolve));
  }

  /**
   * Retrieves whether or not the class instance is ready.
   */
  getIsReady(): boolean {
    return this._isReady;
  }

  /**
   * The unique identifier which represents this class instance.
   */
  // TODO: [3.0.0] Show i.e. example in comments, similar to getShortUUID
  getUUID(): string {
    return this._uuid;
  }

  /**
   * The short unique identifier which represents this class instance.
   *
   * i.e. "mhvXdrZT4jP5T8vBxuvm75"
   */
  getShortUUID(): string {
    return this._shortUUID;
  }

  /**
   * Determines whether the passed instance is the same as the current
   * instance.
   */
  getIsSameInstance(instance: PhantomCore | Class): boolean {
    return Object.is(this, instance);
  }

  /**
   * Retrieves the non-instantiated class definition.
   */
  getClass(): Function {
    return this.constructor;
  }

  /**
   * IMPORTANT: This is not safe to rely on and may be modified if the script
   * is minified.
   */
  getClassName(): string {
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
  ): void {
    if (!PhantomCore.getIsLooseInstance(targetInstance)) {
      throw new ReferenceError("targetInstance is not a PhantomCore instance");
    }

    if (this.getIsSameInstance(targetInstance)) {
      throw new ReferenceError("targetInstance cannot be bound to itself");
    }

    this._eventProxyStack.addProxyHandler(
      EventProxyStackBindTypes.On,
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
  ): void {
    if (!PhantomCore.getIsLooseInstance(targetInstance)) {
      throw new ReferenceError("targetInstance is not a PhantomCore instance");
    }

    if (this.getIsSameInstance(targetInstance)) {
      throw new ReferenceError("targetInstance cannot be bound to itself");
    }

    this._eventProxyStack.addProxyHandler(
      EventProxyStackBindTypes.Once,
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
  ): void {
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
   */
  getInstanceUptime(): number {
    if (!this.getIsDestroyed()) {
      return getUnixTime() - this._instanceStartTime;
    } else {
      return 0;
    }
  }

  /**
   * Creates a timeout which is managed by this instance of PhantomCore.
   */
  setTimeout(fn: Function, delay = 0): NodeJS.Timeout {
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
  clearAllTimeouts(): void {
    return this._timerStack.clearAllTimeouts();
  }

  /**
   * Creates an interval which is managed by this instance of PhantomCore.
   */
  setInterval(fn: Function, delay = 0): NodeJS.Timeout {
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
  clearAllIntervals(): void {
    return this._timerStack.clearAllIntervals();
  }

  /**
   * Clears all timeouts and intervals managed by this instance of PhantomCore.
   */
  clearAllTimers(): void {
    return this._timerStack.clearAllTimers();
  }

  /**
   * NOTE: Order of operations for shutdown handling:
   *
   *  1. [implementation defined] destroyHandler
   *  2. EVT_DESTROY triggers
   *  3. registerCleanupHandler call stack
   */
  override async destroy(destroyHandler?: () => void): Promise<void> {
    return super.destroy(
      async () => {
        if (typeof destroyHandler === "function") {
          await destroyHandler();
        }

        this.log.debug("Destructed");
      },
      async () => {
        const cleanupQueueDepth = this._cleanupHandlerStack.getQueueDepth();

        this.log.debug(
          `Executing ${cleanupQueueDepth} cleanup handler${
            cleanupQueueDepth !== 1 ? "s" : ""
          }`
        );

        await this._cleanupHandlerStack.exec();

        // FIXME: If wanting to do further logging, the global logger should be
        // utilized

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
