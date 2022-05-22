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
  protected _state: { [key: string]: unknown } = {};

  constructor(initialState = {}, superOptions = {}) {
    super(superOptions);

    if (initialState) {
      this.setState(initialState);
    }

    // Reset state on destruct
    this.registerCleanupHandler(() => {
      // Ignoring because we don't want this to be an optional property during
      // runtime
      // @ts-ignore
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
   */
  setState(partialNextState: { [key: string]: unknown }, isMerge = true) {
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
