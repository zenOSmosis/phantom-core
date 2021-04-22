const EventEmitter = require("events");
const uuidv4 = require("uuid").v4;

const getUnixTime = require("./time/getUnixTime");

const EVT_READY = "ready";
const EVT_UPDATED = "updated";
const EVT_DESTROYED = "destroyed";

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
  static getInstanceWithUuid(uuid) {
    return _instances[uuid];
  }

  // TODO: Provide optional singleton support
  constructor(params = { isReady: true }) {
    super();

    this._isDestroyed = false;
    this._uuid = uuidv4();

    _instances[this._uuid] = this;

    // TODO: Make constructor configurable to set if already ready
    this._isReady = params.isReady || false;

    this.once(EVT_READY, () => {
      this._isReady = true;
    });

    this._instanceStartTime = getUnixTime();

    if (this._isReady) {
      // NOTE: This timeout is utilized to allow EVT_READY event listener to be
      // triggered after instantiation
      setTimeout(() => {
        this.emit(EVT_READY);
      });
    }

    // TODO: Use class-level logger (npm debug library and / or logger w/ debug bindings)
    // console.debug(`Constructed ${this.getClassName()} @ ${this._uuid}`);
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
   * Retrieves the number of seconds since this instance was instantiated.
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
   * @return {boolean}
   */
  getIsDestroyed() {
    return this._isDestroyed;
  }

  /**
   * Unique identifier which represents this class instance.
   *
   * @return {string}
   */
  getUuid() {
    return this._uuid;
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
   * @return {string}
   */
  getClassName() {
    return this.constructor.name;
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
