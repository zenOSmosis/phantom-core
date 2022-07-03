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
 * Wraps an arbitrary object with a PhantomCore instance.
 */
export default class ArbitraryPhantomWrapper<T = unknown> extends PhantomCore {
  protected _wrappedValue!: T;

  constructor(wrappedValue: T, options: CommonOptions = {}) {
    super(options);

    this._setWrappedValue(wrappedValue);
  }

  // TODO: [3.0.0] Document
  protected _setWrappedValue(wrappedValue: T): void {
    if (this._wrappedValue) {
      throw new Error("_setWrappedValue cannot be called more than once");
    }

    if (!wrappedValue) {
      throw new ReferenceError("wrappedValue is not set");
    }

    this._wrappedValue = wrappedValue;

    this.registerCleanupHandler(() => {
      this.dereference(this._wrappedValue);
    });
  }

  /**
   * Retrieves the wrapped object which was specified during the class instance
   * creation.
   */
  getWrappedValue(): T {
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
