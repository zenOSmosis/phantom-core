import CommonEventEmitter from "./CommonEventEmitter";
import getClassName from "./utils/class-utils/getClassName";
import Logger from "./Logger";

/**
 * @event EVT_BEFORE_DESTROY Emits directly before any destructor handling.
 */
export const EVT_BEFORE_DESTROY = "before-destroy";

/**
 * @event EVT_DESTROY_STACK_TIME_OUT Emits when destroy stack has timed out.
 * This should lead to an error.
 */
export const EVT_DESTROY_STACK_TIME_OUT = "destroy-stack-time-out";

/**
 * @export EVT_DESTROY Emits just before event handlers have been removed and
 * any post-destruct operations are invoked.
 */
export const EVT_DESTROY = "destroy";

// Number of milliseconds before the instance will warn about potential
// destruct problems
export const SHUT_DOWN_GRACE_PERIOD = 5000;

/**
 * Common base class for PhantomCore and any utilities which PhantomCore may
 * need to use within the core itself.
 *
 * For most purposes, PhantomCore should be utilized instead of this.
 */
export default class DestructibleEventEmitter extends CommonEventEmitter {
  protected _hasDestroyStarted: boolean;
  protected _isDestroyed: boolean;
  protected _logger: Console | Logger;

  /**
   * Console represents the default logger due to Logger extending
   * DestructibleEventEmitter as well.
   *
   * IMPORTANT: If the Logger class is utilized, it is not automatically
   * destructed when DestructibleEventEmitter is.
   */
  constructor(logger = console) {
    super();

    this._logger = logger;

    this._hasDestroyStarted = false;
    this._isDestroyed = false;

    // Prevent incorrect usage of EVT_DESTROY; EVT_DESTROY should only be
    // emit internally during the shutdown phase
    this.on(EVT_DESTROY, () => {
      if (!this._isDestroyed) {
        // IMPORTANT: Don't await here; we want to throw the error and destruct
        // the instance at the same time due to it being in a potentially invalid
        // state
        this.destroy();

        throw new Error(
          "EVT_DESTROY was incorrectly emit without initially being in a destroyed state. Destructing instance due to potential state invalidation."
        );
      }
    });
  }

  /**
   * Overrides the log handler with a custom logger.
   */
  set logger(logger: Console | Logger) {
    this._logger = logger;
  }

  get logger() {
    return this._logger;
  }

  /**
   * Retrieves total number of event listeners registered to this instance.
   */
  getTotalListenerCount(): number {
    return this.eventNames()
      .map(eventName => this.listenerCount(eventName))
      .reduce((a, b) => a + b, 0);
  }

  /**
   * Retrieves whether or not the class destruct phase has begun.
   */
  getHasDestroyStarted(): boolean {
    return this._hasDestroyStarted;
  }

  /**
   * Retrieves whether or not the instance is currently destroyed.
   */
  getIsDestroyed(): boolean {
    return this._isDestroyed;
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
   * @emits EVT_DESTROY_STACK_TIME_OUT Emits if the destroy handler stack
   * takes longer than expected to execute.
   * @emits EVT_DESTROY Emits a single time, regardless of calls to the
   * destroy() method, after the destroy handler stack has executed.
   */
  async destroy(
    destroyHandler?: () => void,
    cleanupHandler?: () => void
  ): Promise<void> {
    // Note: This method acts as a "firewall" to the actual destroy sequence handler

    // Determine if already in destructing phase
    if (this._hasDestroyStarted) {
      this.logger.warn(
        `${getClassName(
          this
        )} is already being destroyed. The subsequent call has been ignored. Ensure callers are checking for destroy status before calling destroy().`
      );

      return;
    }

    // Determine if already destructed
    if (this._isDestroyed) {
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
  ): Promise<void> {
    if (this._hasDestroyStarted || this._isDestroyed) {
      throw new Error(
        "Calling __initDestructSequence arbitrarily is not intended. You should call destroy() instead."
      );
    }

    // Start destroying phase

    // TODO: [3.0.0] Document that this is emit immediately before destroy started
    this.emit(EVT_BEFORE_DESTROY);

    this._hasDestroyStarted = true;

    if (typeof destroyHandler === "function") {
      // FIXME: There might can be better way of doing this rather than a
      // setTimeout (i.e. use a map of destroying instances)
      //
      // Determine if entering into a circular awaiting "gridlock" situation,
      // where two or more instances await on one another to shutdown
      const longRespondDestroyHandlerTimeout = setTimeout(() => {
        this.emit(EVT_DESTROY_STACK_TIME_OUT);
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
    // IMPORTANT: It is by design _isDestroyed is set to true before
    // _hasDestroyStarted is set to false. The reasoning is that we want to relay
    // the "destroyed" state to any subsequent event handlers, while not
    // actually being completely done with our cleanup work at this point.
    this._isDestroyed = true;

    // IMPORTANT: This must come before removal of all listeners
    this.emit(EVT_DESTROY);

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
  }
}
