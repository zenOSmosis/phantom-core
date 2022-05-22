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
 * Wraps an arbitrary object with a PhantomCore instance.
 */
export default class ArbitraryPhantomWrapper extends PhantomCore {
  protected _wrappedValue: unknown = null;

  constructor(wrappedValue: unknown, options = {}) {
    super(options);

    this._setWrappedValue(wrappedValue);
  }

  // TODO: [3.0.0] Document
  _setWrappedValue(wrappedValue: unknown) {
    if (this._wrappedValue) {
      throw new Error("_setWrappedValue cannot be called more than once");
    }

    if (!wrappedValue) {
      throw new ReferenceError("wrappedValue is not set");
    }

    this._wrappedValue = wrappedValue;

    this.registerCleanupHandler(() => {
      this._wrappedValue = null;
    });
  }

  /**
   * Retrieves the wrapped object which was specified during the class instance
   * creation.
   */
  getWrappedValue() {
    return this._wrappedValue;
  }

  override async destroy(destroyHandler?: () => void) {
    return super.destroy(async () => {
      if (typeof destroyHandler === "function") {
        await destroyHandler();
      }
    });
  }
}
