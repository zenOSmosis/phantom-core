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

type EncapsulatedValue<T = unknown> = {
  data: T;
  isDefined: boolean;
};

/**
 * Wraps an arbitrary object with a PhantomCore instance.
 */
export default class ArbitraryPhantomWrapper<T = unknown> extends PhantomCore {
  protected _encapsulatedValue: EncapsulatedValue = {
    data: null,
    isDefined: false,
  };

  constructor(wrappedValue: T, options: CommonOptions = {}) {
    super(options);

    this._setWrappedValue(wrappedValue);
  }

  // TODO: [3.0.0] Document
  protected _setWrappedValue(wrappedValue: T): void {
    if (this._encapsulatedValue.isDefined) {
      throw new Error("_setWrappedValue cannot be called more than once");
    }

    if (!wrappedValue) {
      throw new ReferenceError("wrappedValue is not set");
    }

    this._encapsulatedValue = { data: wrappedValue, isDefined: true };

    this.registerCleanupHandler(() => {
      this.dereference(this._encapsulatedValue);
    });
  }

  /**
   * Retrieves the wrapped object which was specified during the class instance
   * creation.
   */
  getWrappedValue(): T | unknown {
    return this._encapsulatedValue?.data;
  }

  override async destroy(destroyHandler?: () => void) {
    return super.destroy(async () => {
      if (typeof destroyHandler === "function") {
        await destroyHandler();
      }
    });
  }
}
