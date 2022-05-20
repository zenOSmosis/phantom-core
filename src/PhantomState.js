import PhantomCore, {
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATED,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIMED_OUT,
  EVT_DESTROYED,
} from "./PhantomCore";

export {
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATED,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIMED_OUT,
  EVT_DESTROYED,
};

/**
 * A simple, object-based state management utility.
 */
export default class PhantomState extends PhantomCore {
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
  setState(partialNextState, isMerge = true) {
    if (typeof partialNextState !== "object") {
      throw new TypeError("partialNextState must be an object");
    }

    if (isMerge) {
      this._state = { ...this._state, ...partialNextState };
    } else {
      this._state = partialNextState;
    }

    this.emit(EVT_UPDATED, partialNextState);
  }
}
