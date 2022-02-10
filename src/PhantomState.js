const PhantomCore = require("./PhantomCore");
const {
  /** @export */
  EVT_NO_INIT_WARN,
  /** @export */
  EVT_READY,
  /** @export */
  EVT_UPDATED,
  /** @export */
  EVT_BEFORE_DESTROY,
  /** @export */
  EVT_DESTROY_STACK_TIMED_OUT,
  /** @export */
  EVT_DESTROYED,
} = PhantomCore;

/**
 * A simple, object-based state management utility.
 */
class PhantomState extends PhantomCore {
  /**
   * @param {Object} initialState? [default = {}]
   * @param {Object} superOptions? [default = {}] If set, these options are
   * passed to the super instance.
   */
  constructor(initialState = {}, superOptions = {}) {
    super(superOptions);

    this._state = {};

    if (initialState) {
      this.setState(initialState);
    }

    // Reset state on destruct
    this.registerCleanupHandler(() => {
      this._state = null;
    });
  }

  /**
   * Retrieves the current state.
   *
   * @return {Object}
   */
  getState() {
    return this._state;
  }

  /**
   * Sets the next state, using shallow-merge strategy.
   *
   * NOTE: The previous state object will be re-referenced.
   *
   * @param {Object} partialNextState
   * @param {boolean} isMerge? [default = true]
   * @emits EVT_UPDATED With partialNextState
   * @return {void}
   */
  setState(nextState, isMerge = true) {
    if (typeof nextState !== "object") {
      throw new TypeError("nextState must be an object");
    }

    if (isMerge) {
      this._state = { ...this._state, ...nextState };
    } else {
      this._state = nextState;
    }

    this.emit(EVT_UPDATED, nextState);
  }
}

module.exports = PhantomState;
module.exports.EVT_NO_INIT_WARN = EVT_NO_INIT_WARN;
module.exports.EVT_READY = EVT_READY;
module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_BEFORE_DESTROY = EVT_BEFORE_DESTROY;
module.exports.EVT_DESTROY_STACK_TIMED_OUT = EVT_DESTROY_STACK_TIMED_OUT;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
