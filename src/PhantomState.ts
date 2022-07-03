import PhantomCore, {
  EVT_ERROR,
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
  CommonOptions,
} from "./PhantomCore";
import { RecursiveObject } from "./types";

export {
  EVT_ERROR,
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
};

/**
 * A simple, object-based state management utility.
 */
export default class PhantomState extends PhantomCore {
  // FIXME: [3.0.0]? This may be more performant as a Map:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#objects_vs._maps
  protected _state: RecursiveObject = {};

  constructor(
    initialState: RecursiveObject | null = {},
    superOptions?: CommonOptions
  ) {
    super(superOptions);

    if (initialState) {
      this.setState(initialState as RecursiveObject);
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
   */
  getState() {
    return this._state;
  }

  /**
   * Sets the next state, using shallow-merge strategy.
   *
   * NOTE: The previous state object will be re-referenced.
   */
  setState(partialNextState: RecursiveObject, isMerge = true): void {
    if (typeof partialNextState !== "object") {
      throw new TypeError("partialNextState must be an object");
    }

    if (isMerge) {
      this._state = { ...this._state, ...partialNextState };
    } else {
      this._state = partialNextState;
    }

    this.emit(EVT_UPDATE, partialNextState);
  }
}
