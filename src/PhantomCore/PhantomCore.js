// @see https://github.com/YuzuJS/setImmediate
// Exposes setImmediate as a global, regardless of context
require("setimmediate");

const EventEmitter = require("events");
const DestructibleEventEmitter = require("../_DestructibleEventEmitter");
const Logger = require("../Logger");
const { LOG_LEVEL_INFO } = Logger;
const getPackageJSON = require("../utils/getPackageJSON");
const FunctionStack = require("../FunctionStack");
const { FUNCTION_STACK_OPS_ORDER_LIFO } = FunctionStack;
const getClassName = require("../utils/class-utils/getClassName");
const uuidv4 = require("uuid").v4;
const shortUUID = require("short-uuid");
const dayjs = require("dayjs");
const getUnixTime = require("../utils/getUnixTime");
const getClassInstancePropertyNames = require("../utils/class-utils/getClassInstancePropertyNames");
const getClassInstanceMethodNames = require("../utils/class-utils/getClassInstanceMethodNames");
const autoBindClassInstanceMethods = require("../utils/class-utils/autoBindClassInstanceMethods");
const shallowMerge = require("../utils/shallowMerge");
const EventProxyStack = require("./EventProxyStack");

// Number of milliseconds to allow async inits to initialize before triggering
// warning
const ASYNC_INIT_GRACE_TIME = 5000;

/** @export */
const EVT_NO_INIT_WARN = "no-init-warn";
/** @export */
const EVT_READY = "ready";
/** @export */
const EVT_UPDATED = "updated";
/** @export */
const { EVT_BEFORE_DESTROY, EVT_DESTROY_STACK_TIMED_OUT, EVT_DESTROYED } =
  DestructibleEventEmitter;

// Instances for this particular thread
const _instances = {};

// Methods which should continue working after class destruct
const KEEP_ALIVE_SHUTDOWN_METHODS = [
  "log",
  "listenerCount",
  "getIsDestroying",
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
class PhantomCore extends DestructibleEventEmitter {
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
   *
   * @param {Object} instance
   * @return {boolean}
   */
  static getIsInstance(instance) {
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
   *
   * @param {Object} instance
   * @return {boolean}
   */
  static getIsLooseInstance(instance) {
    return Boolean(
      instance instanceof EventEmitter &&
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
  static getInstanceWithUUID(uuid) {
    return _instances[uuid];
  }

  /**
   * Symbol is a built-in object whose constructor returns a symbol primitive ???
   * also called a Symbol value or just a Symbol ??? that???s guaranteed to be
   * unique. Symbols are often used to add unique property keys to an object
   * that won???t collide with keys any other code might add to the object, and
   * which are hidden from any mechanisms other code will typically use to
   * access the object. That enables a form of weak encapsulation, or a weak
   * form of information hiding.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol
   *
   * @param {Symbol} symbol
   * @return {PhantomCore}
   */
  static getInstanceWithSymbol(symbol) {
    return Object.values(_instances).find(
      instance => instance.getSymbol() === symbol
    );
  }

  /**
   * Retrieves the number of instances for this thread.
   *
   * When an instance is created / destroyed, the number is increased / reduced
   * by one.
   *
   * @return {number}
   */
  static getInstanceCount() {
    return Object.keys(_instances).length;
  }

  /**
   * Shallow-merges two objects together.
   *
   * IMPORTANT: The return is a COPY of the merged; no re-assignment takes place.
   *
   * @param {Object} objA? [optional; default = {}]
   * @param {Object} objB? [optional; default = {}]
   * @return {Object} Returns a shallow-merged clone of objects, where
   * objB overrides objA.
   */
  static mergeOptions(objA, objB) {
    return shallowMerge(objA, objB);
  }

  /**
   * TODO: Provide optional singleton support
   *
   * @param {Object} options? [default={}]
   */
  constructor(options = {}) {
    super();

    const deprecationNotices = [];

    // FIXME: (jh) Remove after isReady has been removed
    if (options && options.isReady !== undefined) {
      deprecationNotices.push(
        "isReady option will be changed to isAsync, defaulting to false"
      );

      if (options.isAsync === undefined) {
        // Transform to new value
        options.isAsync = !options.isReady;
      }

      delete options.isReady;
    }

    // Provide "off" aliasing if it is not available (fixes issue where
    // PhantomCollection could not use off binding in browsers)
    //
    // NOTE (jh): I don't really know why this was not a problem before
    //
    // Reference: https://github.com/zenOSmosis/phantom-core/pull/17
    if (typeof this.off !== "function") {
      this.off = this.removeListener;
    }

    this._uuid = uuidv4();
    this._shortUUID = shortUUID().fromUUID(this._uuid);

    _instances[this._uuid] = this;

    const DEFAULT_OPTIONS = {
      /**
       * If set to true, this._init() MUST be called during the instance
       * construction, or shortly thereafter (otherwise a warning will be
       * raised).
       *
       * Note that if set to false, this._init will be discarded, regardless if
       * it was defined in an extension class.
       *
       * @type {boolean}
       **/
      isAsync: false,

      /** @type {string | number} */
      logLevel: LOG_LEVEL_INFO,

      /**
       * An arbitrary Symbol for this instance, explicitly guaranteed to be
       * unique across instances.
       *
       * @type {Symbol | null}
       **/
      symbol: null,

      /**
       * An arbitrary title for this instance, not guaranteed to be unique
       * across instances.
       *
       * @type {string | null}
       **/
      title: null,

      /**
       * Whether or not to automatically bind PhantomCore class methods to the
       * local PhantomCore class.
       *
       * @type {boolean}
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
            this._options.symbol
          );
        }

        if (typeof this._options.symbol !== "symbol") {
          throw new TypeError("options.symbol is not a Symbol");
        }
      }

      return this._options.symbol;
    })();

    this._title = this._options.title;

    this.logger = new Logger({
      logLevel: this._options.logLevel,

      /**
       * Currently using ISO8601 formatted date; for date rendering options:
       * @see https://day.js.org/docs/en/display/format
       */
      prefix: logLevel =>
        `[${dayjs().format()} ${logLevel} ${this.getClassName()} ${
          this._uuid
        }]`,
    });

    /**
     * NOTE: This is called directly in order to not lose the stack trace.
     *
     * @type {Function} Calling this function directly will indirectly call
     * logger.info(); The logger.trace(), logger.debug(), logger.info(),
     * logger.warn(), and logger.error() properties can be called directly.
     */
    this.log = this.logger.log;

    this.once(EVT_DESTROY_STACK_TIMED_OUT, () => {
      this.log.error(
        "The destruct callstack is taking longer to execute than expected. Ensure a potential gridlock situation is not happening, where two or more PhantomCore instances are awaiting one another to shut down."
      );
    });

    /** @type {number} UTC Unix time */
    this._instanceStartTime = getUnixTime();

    this._isReady = !this._options.isAsync || false;

    // Bound remote event handlers
    this._eventProxyStack = new EventProxyStack();

    // Force method scope binding to class instance
    if (this._options.hasAutomaticBindings) {
      this.autoBind();
    }

    if (this._isReady) {
      // This shouldn't be called if running isAsync
      this._init = undefined;

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
      this.once(EVT_DESTROYED, () => clearTimeout(longRespondInitWarnTimeout));
    }

    deprecationNotices.forEach(deprecation => {
      this.log.warn(`DEPRECATION NOTICE: ${deprecation}`);
    });
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
    await new Promise((resolve, reject) => {
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
   * after EVT_DESTROYED is emit and all event handlers have been removed.
   *
   * @param {Function} fn
   * @return {void}
   */
  registerCleanupHandler(fn) {
    return this._cleanupHandlerStack.push(fn);
  }

  /**
   * Unregisters a function from the cleanup handler stack.
   *
   * @param {Function} fn
   * @returns
   */
  unregisterCleanupHandler(fn) {
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
        PhantomCore.getIsInstance(this[propName]) &&
        !this[propName].getIsDestroyed()
    );
  }

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol
   *
   * @return {Symbol | null}
   */
  getSymbol() {
    return this._symbol;
  }

  /**
   * @return {string | null}
   */
  getTitle() {
    return this._title;
  }

  /**
   * @param {string} title
   * @return {void}
   */
  setTitle(title) {
    this._title = title;

    this.emit(EVT_UPDATED);
  }

  /**
   * Retrieves the options utilized in the class constructor.
   *
   * @return {Object}
   */
  getOptions() {
    return this._options;
  }

  /**
   * Retrieve the option with the given name.
   *
   * @param {string} optionName
   * @return {any}
   */
  getOption(optionName) {
    return this._options[optionName];
  }

  /**
   * Sets the log level, in order to determine log filtering.
   *
   * Accepts either numeric (i.e. LOG_LEVEL_TRACE constant) or string (i.e.
   * "trace") values.
   *
   * @param {number | number} level
   * @return {void}
   */
  setLogLevel(level) {
    this.logger.setLogLevel(level);
  }

  /**
   * @return {number}
   */
  getLogLevel() {
    return this.logger.getLogLevel();
  }

  /**
   * Retrieves all properties registered to this class.
   *
   * NOTE: It doesn't return properties defined via symbols.
   *
   * @see https://stackoverflow.com/a/31055217
   *
   * @return {string[]}
   */
  getPropertyNames() {
    return getClassInstancePropertyNames(this);
  }

  /**
   * Retrieves all methods registered to this class.
   *
   * NOTE: It doesn't return methods defined via symbols.
   *
   * @return {string[]}
   */
  getMethodNames() {
    return getClassInstanceMethodNames(this);
  }

  /**
   * @return {Promise<void>} Resolves once the class instance is ready.
   */
  async onceReady() {
    if (this._isReady) {
      return;
    }

    return new Promise(resolve => this.once(EVT_READY, resolve));
  }

  /**
   * @return {boolean}
   */
  getIsReady() {
    return this._isReady;
  }

  /**
   * Unique identifier which represents this class instance.
   *
   * @return {string}
   */
  getUUID() {
    return this._uuid;
  }

  /**
   * Short unique identifier which represents this class instance.
   *
   * i.e. "mhvXdrZT4jP5T8vBxuvm75"
   *
   * @return {string}
   */
  getShortUUID() {
    return this._shortUUID;
  }

  /**
   * Determines whether the passed instance is the same as the current
   * instance.
   *
   * @param {PhantomCore} instance
   * @return {boolean}
   */
  getIsSameInstance(instance) {
    return Object.is(this, instance);
  }

  /**
   * Retrieves the non-instantiated class definition.
   *
   * @return {Function}
   */
  getClass() {
    return this.constructor;
  }

  /**
   * IMPORTANT: This is not safe to rely on and will be modified if the script
   * is minified.
   *
   * @return {string}
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
   *
   * @param {PhantomCore} targetInstance
   * @param {string | symbol} eventName
   * @param {Function} eventHandler
   * @return {void}
   */
  proxyOn(targetInstance, eventName, eventHandler) {
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
   *
   * @param {PhantomCore} targetInstance
   * @param {string | symbol} eventName
   * @param {Function} eventHandler
   * @return {void}
   */
  proxyOnce(targetInstance, eventName, eventHandler) {
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
   *
   * @param {PhantomCore} targetInstance
   * @param {string | symbol} eventName
   * @param {Function} eventHandler
   * @return {void}
   */
  proxyOff(targetInstance, eventName, eventHandler) {
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
   * NOTE: Order of operations for shutdown handling:
   *
   *  1. [implementation defined] destroyHandler
   *  2. EVT_DESTROYED triggers
   *  3. registerCleanupHandler call stack
   *
   * @param {Function} destroyHandler? [optional] If defined, will execute
   * prior to normal destruct operations for this class.
   * @return {Promise<void>}
   */
  async destroy(destroyHandler = () => null) {
    return super.destroy(
      async () => {
        // Unregister from _instances
        delete _instances[this._uuid];

        await destroyHandler();

        await this._eventProxyStack.destroy();
        this._eventProxyStack = null;
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

        for (const methodName of this.getMethodNames()) {
          // Force non-keep-alive methods to return undefined
          if (!KEEP_ALIVE_SHUTDOWN_METHODS.includes(methodName)) {
            this[methodName] = () => undefined;
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

module.exports = PhantomCore;

module.exports.EVT_NO_INIT_WARN = EVT_NO_INIT_WARN;
module.exports.EVT_READY = EVT_READY;
module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_BEFORE_DESTROY = EVT_BEFORE_DESTROY;
module.exports.EVT_DESTROY_STACK_TIMED_OUT = EVT_DESTROY_STACK_TIMED_OUT;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
