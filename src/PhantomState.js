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
    this.registerShutdownHandler(() => {
      this._state = {};
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
   * @emits EVT_UPDATED With partialNextState
   * @return {void}
   */
  setState(partialNextState) {
    if (typeof partialNextState !== "object") {
      throw new TypeError("setState must be called with an object");
    }

    this._state = { ...this._state, ...partialNextState };

    this.emit(EVT_UPDATED, partialNextState);
  }
}

module.exports = PhantomState;
module.exports.EVT_NO_INIT_WARN = EVT_NO_INIT_WARN;
module.exports.EVT_READY = EVT_READY;
module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_BEFORE_DESTROY = EVT_BEFORE_DESTROY;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
