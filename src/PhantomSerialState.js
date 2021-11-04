const PhantomState = require("./PhantomState");
const {
  /** @export */
  EVT_NO_INIT_WARN,
  /** @export */
  EVT_READY,
  /** @export */
  EVT_UPDATED,
  /** @export */
  EVT_DESTROYED,
} = PhantomState;

class PhantomSerialState extends PhantomState {
  /**
   * Sets the next state, using shallow-merge strategy.
   *
   * NOTE: The previous state object will be re-referenced.
   *
   * @param {Object} partialNextState IMPORTANT: The keys / values of this
   * object must be a serializable type (i.e. a string, number, boolean or null).
   * @emits EVT_UPDATED With partialNextState
   * @return {void}
   */
  setState(partialNextState) {
    partialNextState = JSON.parse(JSON.stringify(partialNextState));

    return super.setState(partialNextState);
  }
}

module.exports = PhantomSerialState;
module.exports.EVT_NO_INIT_WARN = EVT_NO_INIT_WARN;
module.exports.EVT_READY = EVT_READY;
module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
