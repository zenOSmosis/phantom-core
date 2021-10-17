const EventEmitter = require("events");
const Logger = require("./Logger");
const { LOG_LEVEL_INFO } = Logger;
const uuidv4 = require("uuid").v4;
const shortUUID = require("short-uuid");
const deepMerge = require("deepmerge");
const dayjs = require("dayjs");

const getUnixTime = require("./utils/getUnixTime");

// Amount of milliseconds to allow async inits to initialize before triggering
// warning
const ASYNC_INIT_GRACE_TIME = 5000;

/** @export */
const EVT_READY = "ready";
/** @export */
const EVT_UPDATED = "updated";
/** @export */
const EVT_DESTROYED = "destroyed";
/** @export */
const EVT_NO_INIT_WARN = "no-init-warn";

// Instances for this particular thread
const _instances = {};

// Methods which should continue working after class destruct
const KEEP_ALIVE_SHUTDOWN_METHODS = [
  "off",
  "removeListener",
  "log",
  "listenerCount",
  "getIsDestroyed",
  "getInstanceUptime",
  "getTotalListenerCount",
  // super method names
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
 * Base class which Phantom Server components derive.
 *
 * TODO: Update description.
 */
class PhantomCore extends EventEmitter {
  /**
   * @param {Object} instance
   * @return {boolean} Whether or not the given instance is, or extends,
   * PhantomCore.
   */
  static getIsInstance(instance) {
    return instance instanceof PhantomCore;
  }

  /**
   * @param {Object} defaultOptions? [optional; default = {}]
   * @param {Object} userLevelOptions? [optional; default = {}]
   * @return {Object} Returns a deep merged clone of options, where
   * userLevelOptions overrides defaultOptions.
   */
  static mergeOptions(defaultOptions = {}, userLevelOptions = {}) {
    // Typecast null options to Object for robustness of implementors (i.e.
    // media-stream-track-controller may pass null when merging optional
    // MediaStreamTrack constraints)
    if (defaultOptions === null) defaultOptions = {};
    if (userLevelOptions === null) userLevelOptions = {};

    return deepMerge(defaultOptions, userLevelOptions);
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
   * Symbol is a built-in object whose constructor returns a symbol primitive —
   * also called a Symbol value or just a Symbol — that’s guaranteed to be
   * unique.  Symbols are often used to add unique property keys to an object
   * that won’t collide with keys any other code might add to the object, and
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
   * TODO: Provide optional singleton support
   *
   * @param {Object} options? [default={}]
   */
  constructor(options = {}) {
    super();

    if (options && options.isReady !== "undefined") {
      console.warn(
        "DEPRECATION NOTICE: isReady option will be changed to isAsync, defaulting to false"
      );
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

    const DEFAULT_OPTIONS = {
      /**
       * If set to false, this._init() MUST be called during the instance
       * construction.
       *
       * The ready state can be detected by checking this.getIsReady() or
       * awaited for by this.onceReady().
       *
       * @type {boolean}
       **/
      isReady: true,

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
    };

    // Options should be considered immutable.
    this._options = Object.freeze(
      PhantomCore.mergeOptions(DEFAULT_OPTIONS, options)
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
     * @type {function} Calling this function directly will indirectly call
     * logger.info(); The logger.trace(), logger.debug(), logger.info(), logger.warn(), and
     * logger.error() properties can be called directly.
     */
    this.log = this.logger.log;

    this._isDestroyed = false;

    _instances[this._uuid] = this;

    /** @type {number} UTC Unix time */
    this._instanceStartTime = getUnixTime();

    this._isReady = this._options.isReady || false;

    if (this._isReady) {
      // IMPORTANT: Implementations which set isReady to false must call _init
      // on their own

      this._init();
    } else {
      // Warn if _init() is not invoked in a short time period
      const initTimeout = setTimeout(() => {
        this.logger.warn(
          "_init has not been called in a reasonable amount of time"
        );

        this.emit(EVT_NO_INIT_WARN);
      }, ASYNC_INIT_GRACE_TIME);

      this.once(EVT_READY, () => clearTimeout(initTimeout));
      this.once(EVT_DESTROYED, () => clearTimeout(initTimeout));
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
    if (this._isReady) {
      throw new ReferenceError(
        "Cannot call _init because isReady state is set to true"
      );
    }

    this._init = () => {
      throw new ReferenceError("_init cannot be called more than once");
    };

    // Await promise so that EVT_READY listeners can be invoked on next event
    // loop cycle
    await new Promise(resolve =>
      setTimeout(() => {
        // NOTE (jh): I didn't add reject here due to potential breaking
        // changes
        if (!this._isDestroyed) {
          this._isReady = true;
          this.emit(EVT_READY);
        }

        resolve();
      })
    );
  }

  /**
   * @return {Promise<void>}
   */
  async destroy() {
    if (!this._isDestroyed) {
      delete _instances[this._uuid];

      // Note: Setting this flag before-hand is intentional
      this._isDestroyed = true;

      this.emit(EVT_DESTROYED);

      // Unbind all listeners
      this.removeAllListeners();

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

      // TODO: Force regular class properties to be null (as of July 30, 2021, not changing due to unforeseen consequences)
    }
  }

  /**
   * @return {boolean}
   */
  getIsDestroyed() {
    return this._isDestroyed;
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
    const properties = new Set();
    let currentObj = this;

    do {
      Object.getOwnPropertyNames(currentObj).map(item => properties.add(item));
    } while ((currentObj = Object.getPrototypeOf(currentObj)));

    return [...properties.keys()];
  }

  /**
   * Retrieves all methods registered to this class.
   *
   * NOTE: It doesn't return methods defined via symbols.
   *
   * @return {string[]}
   */
  getMethodNames() {
    const propertyNames = this.getPropertyNames();

    return propertyNames.filter(item => typeof this[item] === "function");
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
   * @return {string}
   */
  getClassName() {
    return this.constructor.name;
  }

  /**
   * Binds an "on" event listener to another PhantomCore instance.
   *
   * This should not be confused with JavaScript object proxies and is not
   * intended to work the same way.
   *
   * NOTE: Unlike the original event emitter method, this does NOT return a
   * reference to the underlying class for optional chaining.
   *
   * @param {PhantomCore} proxyInstance
   * @param {string | symbol} eventName
   * @param {function} eventHandler
   * @return {void}
   */
  proxyOn(proxyInstance, eventName, eventHandler) {
    if (!PhantomCore.getIsInstance(proxyInstance)) {
      throw new ReferenceError("proxyInstance is not a PhantomCore instance");
    }

    if (this.getIsSameInstance(proxyInstance)) {
      throw new ReferenceError("proxyInstance cannot be bound to itself");
    }

    proxyInstance.on(eventName, eventHandler);

    // Unbind from proxy instance once local class is destroyed
    this.once(EVT_DESTROYED, () =>
      this.proxyOff(proxyInstance, eventName, eventHandler)
    );
  }

  /**
   * Binds a "once" event listener to another PhantomCore instance.
   *
   * This should not be confused with JavaScript object proxies and is not
   * intended to work the same way.
   *
   * NOTE: Unlike the original event emitter method, this does NOT return a
   * reference to the underlying class for optional chaining.
   *
   * @param {PhantomCore} proxyInstance
   * @param {string | symbol} eventName
   * @param {function} eventHandler
   * @return {void}
   */
  proxyOnce(proxyInstance, eventName, eventHandler) {
    if (!PhantomCore.getIsInstance(proxyInstance)) {
      throw new ReferenceError("proxyInstance is not a PhantomCore instance");
    }

    if (this.getIsSameInstance(proxyInstance)) {
      throw new ReferenceError("proxyInstance cannot be bound to itself");
    }

    proxyInstance.once(eventName, eventHandler);

    // Unbind from proxy instance once local class is destroyed
    //
    // FIXME: Try to automatically unbind destroyed handler once proxy instance
    // once runs. NOTE: Wrapping eventHandler will not work as intended because
    // when trying to externally unbind with proxyOff (i.e. via unit tests or
    // implementation usage [not the following line]) the original event
    // handler reference is lost.
    this.once(EVT_DESTROYED, () =>
      this.proxyOff(proxyInstance, eventName, eventHandler)
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
   * @param {PhantomCore} proxyInstance
   * @param {string | symbol} eventName
   * @param {function} eventHandler
   * @return {void}
   */
  proxyOff(proxyInstance, eventName, eventHandler) {
    if (!PhantomCore.getIsInstance(proxyInstance)) {
      throw new ReferenceError("proxyInstance is not a PhantomCore instance");
    }

    if (this.getIsSameInstance(proxyInstance)) {
      throw new ReferenceError("proxyInstance cannot be bound to itself");
    }

    // Unbind from proxy instance
    proxyInstance.off(eventName, eventHandler);
  }

  /**
   * Retrieves total number of event listeners registered to this instance.
   *
   * @return {number}
   */
  getTotalListenerCount() {
    return this.eventNames()
      .map(eventName => this.listenerCount(eventName))
      .reduce((a, b) => a + b, 0);
  }

  /**
   * Retrieves the number of seconds since this class instance was
   * instantiated.
   *
   * @return {number}
   */
  getInstanceUptime() {
    if (!this._isDestroyed) {
      return getUnixTime() - this._instanceStartTime;
    } else {
      return 0;
    }
  }
}

module.exports = PhantomCore;
module.exports.EVT_READY = EVT_READY;
module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
module.exports.EVT_NO_INIT_WARN = EVT_NO_INIT_WARN;
