const EventEmitter = require("events");
const getClassName = require("./utils/class-utils/getClassName");
const logger = require("./globalLogger");

/** @export */
const EVT_BEFORE_DESTROY = "before-destroy";

/** @export */
const EVT_DESTROY_STACK_TIMED_OUT = "destroy-stack-timed-out";

/** @export */
const EVT_DESTROYED = "destroyed";

// Number of milliseconds before the instance will warn about potential
// destruct problems
const SHUT_DOWN_GRACE_PERIOD = 5000;

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

    // Prevent incorrect usage of EVT_DESTROYED; EVT_DESTROYED should only be
    // emit internally during the shutdown phase
    this.on(EVT_DESTROYED, () => {
      if (!this._isDestroyed) {
        // IMPORTANT: Don't await here; we want to throw the error and destruct
        // the instance at the same time due to it being in a potentially invalid
        // state
        this.destroy();

        throw new Error(
          "EVT_DESTROYED was incorrectly emit without initially being in a destroyed state. Destructing instance due to potential state invalidation."
        );
      }
    });
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
   * Retrieves whether or not the class is currently being destroyed.
   *
   * @return {boolean}
   */
  getIsDestroying() {
    return this._isDestroying;
  }

  /**
   * Retrieves whether or not the instance is currently destroyed.
   *
   * @return {boolean}
   */
  getIsDestroyed() {
    return this._isDestroyed;
  }

  /**
   * @param {Function} destroyHandler? [optional] If defined, will execute
   * prior to normal destruct operations for this instance.
   * @param {Function} postDestroyHandler? [optional] If defined, will execute
   * after all event listeners have been removed from the instance. This is
   * primarily used for the PhantomCore superclass and exposed via
   * registerCleanupHandler to inheriting classes of PhantomCore.
   * @return {Promise<void>}
   * @emits EVT_BEFORE_DESTROY Emits a single time, regardless of calls to the
   * destroy() method, before the destroy handler stack is executed.
   * @emits EVT_DESTROY_STACK_TIMED_OUT Emits if the destroy handler stack
   * takes longer than expected to execute.
   * @emits EVT_DESTROYED Emits a single time, regardless of calls to the
   * destroy() method, after the destroy handler stack has executed.
   */
  async destroy(destroyHandler = () => null, postDestroyHandler = () => null) {
    if (this._isDestroying) {
      logger.warn(
        `${getClassName(
          this
        )} is already being destroyed. The subsequent call has been ignored. Ensure callers are checking for destroy status before calling destroy().`
      );
    } else if (this._isDestroyed) {
      // NOTE: When calling from PhantomCore, after full destruct, this may not
      // get executed, as PhantomCore itself will reroute the subsequent call to
      // a null handler
      throw new Error(`"${getClassName(this)}" has already been destroyed.`);
    } else {
      this._isDestroying = true;

      this.emit(EVT_BEFORE_DESTROY);

      // Help ensure where to wind up in a circular awaiting "gridlock"
      // situation, where two or more instances await on one another to shutdown
      let longRespondDestroyHandlerTimeout = setTimeout(() => {
        this.emit(EVT_DESTROY_STACK_TIMED_OUT);
      }, SHUT_DOWN_GRACE_PERIOD);

      // TODO: Fix issue where destroyHandler could error and still emit
      // EVT_DESTROY_STACK_TIMED_OUT
      //
      // try {
      await destroyHandler();
      // } catch (err) {
      //  throw err;
      // } finally {
      clearTimeout(longRespondDestroyHandlerTimeout);
      // }

      // Set the state before the event is emit so that any listeners will know
      // the correct state.
      //
      // IMPORTANT: It is by design _isDestroyed is set to true before
      // _isDestroying is set to false. The reasoning is that we want to relay
      // the "destroyed" state to any subsequent event handlers, while not
      // actually being completely done with our cleanup work at this point.
      this._isDestroyed = true;

      // IMPORTANT: This must come before removal of all listeners
      this.emit(EVT_DESTROYED);

      // Remove all event listeners; we're stopped
      this.removeAllListeners();

      // IMPORTANT: This is intended to come after removeAllListeners has been
      // invoked
      await postDestroyHandler();

      if (this.getTotalListenerCount()) {
        throw new Error(
          "An event handler has been registered in a post destruct callback which could cause a potential memory leak."
        );
      }

      // Completely out of "destroying" phase (truly destroyed at this point)
      this._isDestroying = false;
    }
  }
};

module.exports.EVT_BEFORE_DESTROY = EVT_BEFORE_DESTROY;
module.exports.EVT_DESTROY_STACK_TIMED_OUT = EVT_DESTROY_STACK_TIMED_OUT;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
