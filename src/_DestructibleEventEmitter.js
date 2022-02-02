const EventEmitter = require("events");
const getClassName = require("./utils/class-utils/getClassName");

/** @export */
const EVT_BEFORE_DESTROY = "before-destroy";

/** @export */
const EVT_DESTROYED = "destroyed";

/**
 * Common base class for PhantomCore and any utilities which PhantomCore may
 * need to use within the core itself.
 *
 * For most purposes, PhantomCore should be utilized instead of this.
 */
module.exports = class DestructibleEventEmitter extends EventEmitter {
  constructor() {
    super();

    this._isDestroying = false;
    this._isDestroyed = false;
  }

  /**
   * @return {boolean}
   */
  getIsDestroying() {
    return this._isDestroying;
  }

  /**
   * @return {boolean}
   */
  getIsDestroyed() {
    return this._isDestroyed;
  }

  /**
   * @param {Function} destroyHandler? [optional] If defined, will execute
   * prior to normal destruct operations for this class.
   * @return {Promise<void>}
   */
  async destroy(destroyHandler = () => null) {
    if (!this._isDestroyed && !this._isDestroying) {
      this._isDestroying = true;
      this.emit(EVT_BEFORE_DESTROY);

      // Invoke wrapped destroy handler
      await destroyHandler();

      // IMPORTANT: This must come before removal of all listeners
      this._isDestroyed = true;
      this.emit(EVT_DESTROYED);

      this.removeAllListeners();

      this._isDestroying = false;
    }
  }
};

module.exports.EVT_BEFORE_DESTROY = EVT_BEFORE_DESTROY;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
