import PhantomCore, {
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATED,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIMED_OUT,
  EVT_DESTROYED,
  CommonOptions,
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
  // FIXME: [3.0.0]? This may be more performant as a Map:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#objects_vs._maps
  protected _state: { [key: string]: unknown } = {};

  constructor(
    initialState: { [key: string]: unknown } | null = {},
    superOptions: CommonOptions
  ) {
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
