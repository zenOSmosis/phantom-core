const EventEmitter = require("events");
const Logger = require("./Logger");
const { LOG_LEVEL_INFO } = Logger;
const uuidv4 = require("uuid").v4;

const getUnixTime = require("./time/getUnixTime");

const EVT_READY = "ready";
const EVT_UPDATED = "updated";
const EVT_DESTROYED = "destroyed";
const EVT_NO_INIT_WARN = "no-init-warn";

// Instances for this particular thread
const _instances = {};

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
    super();

    this._uuid = uuidv4();

    const DEFAULT_PARAMS = {
      isReady: true,
      logLevel: LOG_LEVEL_INFO,
      // logger: logger.getLogger(this._uuid),
    };

    this._params = { ...DEFAULT_PARAMS, ...params };

    this._logger = new Logger({
      logLevel: this._params.logLevel,
      prefix: logLevel => `[${logLevel} ${this.getClassName()} ${this._uuid}]`,
    });
    this.log = this._logger.log;

    this._isDestroyed = false;

    _instances[this._uuid] = this;

    this._instanceStartTime = getUnixTime();

    this._isReady = this._params.isReady || false;

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
        this.log.warn(
          "_init has not been called in a reasonable amount of time"
        );

        this.emit(EVT_NO_INIT_WARN);
      }, 5000);

      this.once(EVT_READY, () => clearTimeout(initTimeout));
    }
  }

  /**
   * Sets the log level, in order to determine log filtering.
   *
   * Accepts either numeric (i.e. LOG_LEVEL_TRACE constant) or string (i.e.
   * "trace") values.
   *
   * @param {number | number} level
   */
  setLogLevel(level) {
    this._logger.setLogLevel(level);
  }

  /**
   * @return {number}
   */
  getLogLevel() {
    return this._logger.getLogLevel();
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
