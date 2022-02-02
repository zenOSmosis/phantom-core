const EventEmitter = require("events");
const FunctionStack = require("./FunctionStack");
const sleep = require("./utils/sleep");

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

    this._destroyHandlerQueue = new FunctionStack();
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
    if (!this._isDestroying) {
      this._isDestroying = true;

      this.emit(EVT_BEFORE_DESTROY);

      this._destroyHandlerQueue.push(destroyHandler);

      await this._destroyHandlerQueue.exec();

      // IMPORTANT: This must come before removal of all listeners
      this._isDestroyed = true;
      this.emit(EVT_DESTROYED);

      this.removeAllListeners();

      this._isDestroying = false;
    } else if (!this._isDestroyed) {
      // Enable subsequent call with another destroyHandler; this fixes an
      // issue with Chrome / Safari MediaStreamTrackControllerFactory not
      // properly emitting EVT_UPDATED when a child controller is destructed
      // await destroyHandler();
      this._destroyHandlerQueue.push(destroyHandler);

      // Increase potential max listeners by one to prevent potential
      // MaxListenersExceededWarning
      this.setMaxListeners(this.getMaxListeners() + 1);

      // Wait for the instance to be destroyed before resolving (all subsequent
      // destroy() calls should resolve at the same time)
      return new Promise(resolve => this.once(EVT_DESTROYED, resolve));
    }
  }
};

module.exports.EVT_BEFORE_DESTROY = EVT_BEFORE_DESTROY;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
