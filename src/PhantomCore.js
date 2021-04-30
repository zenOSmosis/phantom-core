const EventEmitter = require("events");
const uuidv4 = require("uuid").v4;
const logger = require("loglevel");

const getUnixTime = require("./time/getUnixTime");

const EVT_READY = "ready";
const EVT_UPDATED = "updated";
const EVT_DESTROYED = "destroyed";
const EVT_NO_INIT_WARN = "no-init-warn";

// Instances for this particular thread
const _instances = {};

const LOG_LEVEL_TRACE = 0;
const LOG_LEVEL_DEBUG = 1;
const LOG_LEVEL_INFO = 2;
const LOG_LEVEL_WARN = 3;
const LOG_LEVEL_ERROR = 4;

/**
 * Base class which Phantom Server components derive.
 *
 * TODO: Update description.
 */
class PhantomCore extends EventEmitter {
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
   * @param {Object} params? [default={}]
   */
  constructor(params = {}) {
    const DEFAULT_PARAMS = {
      isReady: true,
      logLevel: LOG_LEVEL_INFO,
      logger: (() => {
        // IMPORTANT: loglevel doesn't support setting levels per instance, so we
        // have to apply our own filtering here.
        //
        // Trace is used intentionally here or else it won't be available if
        // desired.
        logger.setLevel("trace");

        return logger;
      })(),
    };

    params = { ...DEFAULT_PARAMS, ...params };

    super();

    this._isDestroyed = false;

    this._uuid = uuidv4();

    _instances[this._uuid] = this;

    this._instanceStartTime = getUnixTime();

    this._isReady = params.isReady || false;

    this.once(EVT_READY, () => {
      this._isReady = true;
    });

    if (this._isReady) {
      // IMPORTANT: Implementations which set isReady to false must call _init
      // on their own

      this._init();
    } else {
      // Warn if _init() is not invoked shortly

      const initTimeout = setTimeout(() => {
        console.warn(
          "_init has not been called in a reasonable amount of time"
        );

        this.emit(EVT_NO_INIT_WARN);
      }, 5000);

      this.once(EVT_READY, () => clearTimeout(initTimeout));
    }

    // IMPORTANT: This is not directly set as the params log level might be of
    // a string type, where setLogLevel will convert it to the necessary
    // integer type.
    this._logLevel = null;
    this.setLogLevel(params.logLevel);

    this.log = (() => {
      const className = this.getClassName();
      const uuid = this.getUUID();

      const prefix = () => `[${className} ${uuid}]`;

      const logger = params.logger;

      return {
        trace: (...args) =>
          this._logLevel <= LOG_LEVEL_TRACE && logger.trace(prefix(), ...args),
        debug: (...args) =>
          this._logLevel <= LOG_LEVEL_DEBUG && logger.debug(prefix(), ...args),
        info: (...args) =>
          this._logLevel <= LOG_LEVEL_INFO && logger.info(prefix(), ...args),
        warn: (...args) =>
          this._logLevel <= LOG_LEVEL_WARN && logger.warn(prefix(), ...args),
        error: (...args) =>
          this._logLevel <= LOG_LEVEL_ERROR && logger.error(prefix(), ...args),
      };
    })();

    this.log.debug(`Constructed instance`);
  }

  /**
   * Sets the log level, in order to determine log filtering.
   *
   * Accepts either numeric (i.e. LOG_LEVEL_TRACE constant) or string (i.e.
   * "trace") values.
   *
   * @param {number | number} level String values will be numerically mapped to
   * the corresponding constant value.
   */
  setLogLevel(level) {
    if (typeof level === "string") {
      switch (level.toLowerCase()) {
        case "trace":
          level = LOG_LEVEL_TRACE;
          break;

        case "debug":
          level = LOG_LEVEL_DEBUG;
          break;

        case "info":
          level = LOG_LEVEL_INFO;
          break;

        case "warn":
          level = LOG_LEVEL_WARN;
          break;

        case "error":
          level = LOG_LEVEL_ERROR;
          break;

        default:
          throw new Error(`Unknown log level: ${level}`);
      }
    }

    this._logLevel = level;
  }

  /**
   * @return {number}
   */
  getLogLevel() {
    return this._logLevel;
  }

  /**
   * @return {Promise<void>}
   */
  async destroy() {
    if (!this._isDestroyed) {
      delete _instances[this._uuid];

      this.log.debug(`${this.constructor.name} is destructing`);

      // Note: Setting this flag before-hand is intentional
      this._isDestroyed = true;

      this.emit(EVT_DESTROYED);

      // Unbind all listeners
      this.removeAllListeners();

      this.log.debug(`Destructed instance`);
    }
  }

  /**
   * @return {boolean}
   */
  getIsDestroyed() {
    return this._isDestroyed;
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
    // Await promise so that EVT_READY listeners can be invoked on next event
    // loop cycle
    await new Promise(resolve =>
      setTimeout(() => {
        this.emit(EVT_READY);

        resolve();
      })
    );
  }

  /**
   * @return {Promise} Resolves once the class instance is ready.
   */
  onceReady() {
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

  // TODO: Add proxyOn, proxyOnce, proxyOff methods to use event emitters from
  // other instances while binding them to this instance lifecycle,
  // unregistering the proxied listener when this instance destructs

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

  /**
   * Retrieves the number of listeners associated with the given event.
   *
   * @param {string} eventName
   * @return {number}
   */
  getListenerCount(eventName) {
    return this.listenerCount(eventName);
  }
}

module.exports = PhantomCore;
module.exports.EVT_READY = EVT_READY;
module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
module.exports.EVT_NO_INIT_WARN = EVT_NO_INIT_WARN;

module.exports.LOG_LEVEL_TRACE = LOG_LEVEL_TRACE;
module.exports.LOG_LEVEL_DEBUG = LOG_LEVEL_DEBUG;
module.exports.LOG_LEVEL_INFO = LOG_LEVEL_INFO;
module.exports.LOG_LEVEL_WARN = LOG_LEVEL_WARN;
module.exports.LOG_LEVEL_ERROR = LOG_LEVEL_ERROR;
