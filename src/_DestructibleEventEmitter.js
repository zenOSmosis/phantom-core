const EventEmitter = require("events");
const FunctionStack = require("./FunctionStack");
const getClassName = require("./utils/class-utils/getClassName");
const sleep = require("./utils/sleep");

/** @export */
const EVT_BEFORE_DESTROY = "before-destroy";

/** @export */
const EVT_DESTROY_STACK_TIMED_OUT = "destroy-stack-timed-out";

/** @export */
const EVT_DESTROYED = "destroyed";

// Number of milliseconds the destroyHandlerStack has to execute before
// warnings are generated
const DESTROY_STACK_GRACE_PERIOD = 5000;

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

    this._destroyHandlerStack = new FunctionStack();

    // TODO: Remove?
    this._destroyPhase = null;

    // Prevent incorrect usage of EVT_DESTROYED; EVT_DESTROYED should only be
    // emit internally during the shutdown phase
    this.on(EVT_DESTROYED, () => {
      if (!this._isDestroyed) {
        // IMPORTANT: Don't await here; we want to throw the error and destruct
        // the instance at the same time due to it being in a potentially invalid
        // state
        this.destroy();

        throw new Error(
          "EVT_DESTROYED was incorrectly emit without initially being in a destroyed state.  Destructing instance due to potential state invalidation."
        );
      }
    });
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
   * NOTE: This method may be called more than once should there be two calls
   * with different "destroyHandler" callback functions.  A potential scenario
   * for this is using PhantomCollection extensions which may have intricate
   * shutdown handler event ties.
   *
   * Subsequent calls will add the user-defined destroyHandler callback to a
   * queue managed by FunctionStack.
   *
   * @param {Function} destroyHandler? [optional] If defined, will execute
   * prior to normal destruct operations for this class.
   * @return {Promise<void>}
   * @emits EVT_BEFORE_DESTROY Emits a single time, regardless of calls to the
   * destroy() method, before the destroy handler stack is executed.
   * @emits EVT_DESTROY_STACK_TIMED_OUT Emits if the destroy handler stack
   * takes longer than expected to execute.
   * @emits EVT_DESTROYED Emits a single time, regardless of calls to the
   * destroy() method, after the destroy handler stack has executed.
   */
  async destroy(destroyHandler = () => null) {
    if (this._isDestroyed) {
      console.warn(
        `"${getClassName(
          this
        )}" has been destructed.  Ignoring subsequent destruct attempt.`
      );

      // TODO: Add unit test to ensure subsequent destroyHandler is not invoked after shutdown

      return;
    }

    if (!this._isDestroying) {
      this._isDestroying = true;

      // TODO: Remove?
      this._destroyPhase = "a";

      this.emit(EVT_BEFORE_DESTROY);

      this._destroyHandlerStack.push(destroyHandler);

      let longRespondDestroyHandlerTimeout = setTimeout(() => {
        this.emit(EVT_DESTROY_STACK_TIMED_OUT);
      }, DESTROY_STACK_GRACE_PERIOD);

      // This try / catch fixes an issue where an error in the callstack
      // doesn't clear the longRespondDestroyHandlerTimeout
      try {
        // TODO: Remove?
        this._destroyPhase = "b";

        await this._destroyHandlerStack.exec();
      } catch (err) {
        // TODO: Remove?
        this._destroyPhase = "be";

        throw err;
      } finally {
        // TODO: Remove?
        this._destroyPhase = "c";

        clearTimeout(longRespondDestroyHandlerTimeout);

        // Remove remaining functions from stack, if exist (this should
        // already have happened automatically once the stack was executed)
        this._destroyHandlerStack.clear();

        // Remove reference to destroy handler stack
        this._destroyHandlerStack = null;

        // TODO: Remove?
        this._destroyPhase = "d";
      }

      // TODO: Remove?
      this._destroyPhase = "e";

      // Set the state before the event is emit so that any listeners will know
      // the correct state
      this._isDestroyed = true;

      // IMPORTANT: This must come before removal of all listeners
      this.emit(EVT_DESTROYED);

      // Remove all event listeners; we're stopped
      this.removeAllListeners();

      // TODO: Remove?
      this._destroyPhase = "f";

      // No longer in "destroying" phase, and destroyed at this point
      // this._isDestroying = false;
    } else if (this._destroyHandlerStack) {
      // Enable subsequent call with another destroyHandler; this fixes an
      // issue with Chrome / Safari MediaStreamTrackControllerFactory not
      // properly emitting EVT_UPDATED when a child controller is destructed
      // await destroyHandler();
      this._destroyHandlerStack.push(destroyHandler);

      // Increase potential max listeners by one to prevent potential
      // MaxListenersExceededWarning
      this.setMaxListeners(this.getMaxListeners() + 1);

      // Wait for the instance to be destroyed before resolving (all subsequent
      // destroy() calls should resolve at the same time)
      return new Promise(resolve => this.once(EVT_DESTROYED, resolve));
    } else {
      // FIXME: (jh) This is able to be reproduced when rapidly starting and
      // stopping an input media device in ReShell, and I'm not yet sure why it's
      // happening.  Rather than throw, I want to treat it more as a warning
      // for the time being.
      console.error(
        "Could not add new destroyHandler to an already destructed destroyHandlerStack",
        {
          isDestroyed: this._isDestroyed,
          isDestroying: this._isDestroying,
          destroyPhase: this._destroyPhase,
          destroyHandler: destroyHandler.toString(),
        }
      );
    }
  }
};

module.exports.EVT_BEFORE_DESTROY = EVT_BEFORE_DESTROY;
module.exports.EVT_DESTROY_STACK_TIMED_OUT = EVT_DESTROY_STACK_TIMED_OUT;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
