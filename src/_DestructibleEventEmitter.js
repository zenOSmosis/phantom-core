const EventEmitter = require("events");

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
  getIsDestroyed() {
    return this._isDestroyed;
  }

  /**
   * @param {Function} destroyHandler? [optional] If defined, will execute
   * prior to normal destruct operations for this class.
   * @return {Promise<void>}
   */
  async destroy(destroyHandler = () => null) {
    if (!this._isDestroying) {
      this._isDestroying = true;

      await destroyHandler();

      // Note: Setting this flag before-hand is intentional
      this._isDestroyed = true;

      this.emit(EVT_DESTROYED);

      // Unbind all listeners
      this.removeAllListeners();
    }
  }
};

module.exports.EVT_DESTROYED = EVT_DESTROYED;
