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

  _setWrappedValue(wrappedValue: unknown) {
    if (this._wrappedValue) {
      throw new Error("_setWrappedValue cannot be called more than once");
    }

    if (!wrappedValue) {
      throw new ReferenceError("wrappedValue is not set");
    }

    this._wrappedValue = wrappedValue;
  }

  /**
   * Retrieves the wrapped object which was specified during the class instance
   * creation.
   *
   * @return {any}
   */
  getWrappedValue() {
    return this._wrappedValue;
  }

  /**
   * @param {Function} destroyHandler? [optional] If defined, will execute
   * prior to normal destruct operations for this class.
   * @return {Promise<void>}
   */
  async destroy(destroyHandler?: () => void) {
    return super.destroy(async () => {
      if (typeof destroyHandler === "function") {
        await destroyHandler();
      }

      // IMPORTANT: Setting this AFTER super destroy so that it can potentially
      // be intercepted by other destruct handlers in extension classes
      this._wrappedValue = null;
    });
  }
}
