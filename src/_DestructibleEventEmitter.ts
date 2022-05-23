import EventEmitter from "events";
import getClassName from "./utils/class-utils/getClassName";
import logger from "./globalLogger";

/**
 * @event EVT_BEFORE_DESTROY Emits directly before any destructor handling.
 */
export const EVT_BEFORE_DESTROY = "before-destroy";

/**
 * @event EVT_DESTROY_STACK_TIMED_OUT Emits when destroy stack has timed out.
 * This should lead to an error.
 */
export const EVT_DESTROY_STACK_TIMED_OUT = "destroy-stack-timed-out";

/**
 * @export EVT_DESTROYED Emits just before event handlers have been removed and
 * any post-destruct operations are invoked.
 */
export const EVT_DESTROYED = "destroyed";

// Number of milliseconds before the instance will warn about potential
// destruct problems
export const SHUT_DOWN_GRACE_PERIOD = 5000;

/**
 * Common base class for PhantomCore and any utilities which PhantomCore may
 * need to use within the core itself.
 *
 * For most purposes, PhantomCore should be utilized instead of this.
 */
export default class DestructibleEventEmitter extends EventEmitter {
  protected UNSAFE_isDestroying: boolean;
  protected UNSAFE_isDestroyed: boolean;

  constructor() {
    super();

    this.UNSAFE_isDestroying = false;
    this.UNSAFE_isDestroyed = false;

    // Prevent incorrect usage of EVT_DESTROYED; EVT_DESTROYED should only be
    // emit internally during the shutdown phase
    this.on(EVT_DESTROYED, () => {
      if (!this.UNSAFE_isDestroyed) {
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
   */
  getTotalListenerCount() {
    return this.eventNames()
      .map(eventName => this.listenerCount(eventName))
      .reduce((a, b) => a + b, 0);
  }

  // TODO: [3.0.0] Rename
  /**
   * Retrieves whether or not the class is currently being destroyed.
   *
   * Note that this will still return true after EVT_DESTROYED is emit and will
   * be false after post-cleanup operations have run.
   */
  UNSAFE_getIsDestroying() {
    return this.UNSAFE_isDestroying;
  }

  // TODO: [3.0.0] Rename
  /**
   * Retrieves whether or not the instance is currently destroyed.
   */
  UNSAFE_getIsDestroyed() {
    return this.UNSAFE_isDestroyed;
  }

  // TODO: [3.0.0] Clean up comments
  /**
   * @param {Function} destroyHandler? [optional] If defined, will execute
   * prior to normal destruct operations for this instance.
   * @param {Function} cleanupHandler? [optional] If defined, will execute
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
  async destroy(destroyHandler?: () => void, cleanupHandler?: () => void) {
    // Note: This method acts as a "firewall" to the actual destroy sequence handler

    // Determine if already in destructing phase
    if (this.UNSAFE_isDestroying) {
      logger.warn(
        `${getClassName(
          this
        )} is already being destroyed. The subsequent call has been ignored. Ensure callers are checking for destroy status before calling destroy().`
      );

      return;
    }

    // Determine if already destructed
    if (this.UNSAFE_isDestroyed) {
      // Note: When calling from PhantomCore, after full destruct, this may not
      // get executed, as PhantomCore itself will reroute the subsequent call to
      // a void handler
      throw new Error(`"${getClassName(this)}" has already been destroyed.`);
    }

    // Proceed to destroy sequence
    return this.__initDestructSequence(destroyHandler, cleanupHandler);
  }

  /**
   * Handles the shutdown process for this class instance.
   *
   * Note: This is intended to be called by the destroy method after checks
   * have been made for current phase of destroy sequence.
   */
  private async __initDestructSequence(
    destroyHandler?: () => void,
    cleanupHandler?: () => void
  ) {
    if (this.UNSAFE_isDestroying || this.UNSAFE_isDestroyed) {
      throw new Error(
        "Calling __initDestructSequence arbitrarily is not intended. You should call destroy() instead."
      );
    }

    // Start destroying phase

    this.UNSAFE_isDestroying = true;

    this.emit(EVT_BEFORE_DESTROY);

    if (typeof destroyHandler === "function") {
      // FIXME: There might can be better way of doing this rather than a
      // setTimeout (i.e. use a map of destroying instances)
      //
      // Determine if entering into a circular awaiting "gridlock" situation,
      // where two or more instances await on one another to shutdown
      const longRespondDestroyHandlerTimeout = setTimeout(() => {
        this.emit(EVT_DESTROY_STACK_TIMED_OUT);
      }, SHUT_DOWN_GRACE_PERIOD);

      try {
        await destroyHandler();
      } finally {
        clearTimeout(longRespondDestroyHandlerTimeout);
      }
    }

    // Set the state before the event is emit so that any listeners will know
    // the correct state.
    //
    // IMPORTANT: It is by design UNSAFE_isDestroyed is set to true before
    // UNSAFE_isDestroying is set to false. The reasoning is that we want to relay
    // the "destroyed" state to any subsequent event handlers, while not
    // actually being completely done with our cleanup work at this point.
    this.UNSAFE_isDestroyed = true;

    // IMPORTANT: This must come before removal of all listeners
    this.emit(EVT_DESTROYED);

    // Remove all event listeners; we're stopped
    this.removeAllListeners();

    // IMPORTANT: This is intended to come after removeAllListeners has been
    // invoked
    if (typeof cleanupHandler === "function") {
      await cleanupHandler();
    }

    if (this.getTotalListenerCount()) {
      throw new Error(
        "An event handler has been registered in a post destruct callback which could cause a potential memory leak."
      );
    }

    // TODO: [3.0.0] Rename
    // Completely out of "destroying" phase (truly destroyed at this point)
    this.UNSAFE_isDestroying = false;
  }
}
