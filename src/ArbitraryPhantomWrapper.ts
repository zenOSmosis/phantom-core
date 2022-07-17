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
 * Encapsulation for ArbitraryPhantomWrapper value.
 */
export type EncapsulatedArbitraryPhantomValue<T = unknown> = {
  value: T;
  isUserDefined: boolean;
};

/**
 * Wraps an arbitrary object, or other data type, with a PhantomCore instance.
 *
 * This is useful for extending the PhantomCore lifecycle to non-PhantomCore
 * types.
 */
export default class ArbitraryPhantomWrapper<T = unknown> extends PhantomCore {
  protected _encapsulatedValue: EncapsulatedArbitraryPhantomValue<T> = {
    value: null as unknown as T,
    isUserDefined: false,
  };

  constructor(wrappedValue: T, options: CommonOptions = {}) {
    super(options);

    this._setWrappedValue(wrappedValue);
  }

  // TODO: [3.0.0] Document
  protected _setWrappedValue(wrappedValue: T): void {
    if (this._encapsulatedValue.isUserDefined) {
      throw new Error("_setWrappedValue cannot be called more than once");
    }

    if (!wrappedValue) {
      throw new ReferenceError("wrappedValue is not set");
    }

    this._encapsulatedValue = { value: wrappedValue, isUserDefined: true };

    this.registerCleanupHandler(() => {
      this.dereference(this._encapsulatedValue);
    });
  }

  /**
   * Retrieves the wrapped object which was specified during the class instance
   * creation.
   */
  getWrappedValue(): T {
    return this._encapsulatedValue.value;
  }
}
