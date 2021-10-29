const PhantomCore = require("./PhantomCore");

const {
  /** @export */
  EVT_UPDATED,
  /** @export */
  EVT_DESTROYED,
} = PhantomCore;

/**
 * A simple, object-based state management utility.
 */
class PhantomState extends PhantomCore {
  constructor(initialState = {}) {
    super();

    this._state = Object.freeze(initialState);

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
module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
