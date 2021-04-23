const EventEmitter = require("events");
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
class PhantomBase extends EventEmitter {
  /**
   * Retrieves PhantomBase instance with the given UUID.
   *
   * @param {string} uuid
   * @return {PhantomBase}
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
    const DEFAULT_PARAMS = { isReady: true };

    params = { ...DEFAULT_PARAMS, ...params };

    super();

    this._isDestroyed = false;

    this._uuid = uuidv4();

    _instances[this._uuid] = this;

    this._instanceStartTime = getUnixTime();

    // TODO: Make constructor configurable to set if already ready
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

    // TODO: Use class-level logger (npm debug library and / or logger w/ debug bindings)
    // console.debug(`Constructed ${this.getClassName()} @ ${this._uuid}`);
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
   * @param {PhantomBase} instance
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

  // TODO: Make more use of this
  // TODO: Convert to logger.log?
  /*
  log(...args) {
    console.log(...args);
  }
  */

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

  /**
   * @return {boolean}
   */
  getIsDestroyed() {
    return this._isDestroyed;
  }

  /**
   * @return {Promise<void>}
   */
  async destroy() {
    if (!this._isDestroyed) {
      delete _instances[this._uuid];

      // TODO: Use class-level logger
      // this.log(`${this.constructor.name} is destructing`);

      // Note: Setting this flag before-hand is intentional
      this._isDestroyed = true;

      this.emit(EVT_DESTROYED);

      // Unbind all listeners
      this.removeAllListeners();

      // TODO: Use class-level logger
      // console.debug(`Destructed ${this.getClassName()} @ ${this._uuid}`);
    }
  }
}

module.exports = PhantomBase;
module.exports.EVT_READY = EVT_READY;
module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
module.exports.EVT_NO_INIT_WARN = EVT_NO_INIT_WARN;
