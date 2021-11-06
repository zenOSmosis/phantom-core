const PhantomState = require("./PhantomState");
const { isPlainObject } = require("is-plain-object");
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

class PhantomSerializableState extends PhantomState {
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
    // Run through obj->serial->obj conversion to ensure partial next state can
    // be serialized, while storing it in memory as an object, to enable
    // subsequent partial updates
    partialNextState = this.toObject(this.toSerial(partialNextState));

    return super.setState(partialNextState);
  }

  // TODO: Document
  toSerial(obj) {
    if (typeof obj !== "object") {
      throw new TypeError("Expected object type");
    }

    for (const [key, value] of Object.entries(obj)) {
      // NOTE: Test types were borrowed from: https://www.npmjs.com/package/serialize-javascript
      if (
        value === Infinity ||
        typeof value === "function" ||
        value === undefined ||
        (value !== null &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          !isPlainObject(value))
      ) {
        throw new TypeError(`Unserializable value for key "${key}"`);
      }
    }

    return JSON.stringify(obj);
  }

  // TODO: Document
  toObject(str) {
    return JSON.parse(str);
  }

  // TODO: Document
  getSerializedState() {
    return this.toSerial(this.getState());
  }
}

module.exports = PhantomSerializableState;
module.exports.EVT_NO_INIT_WARN = EVT_NO_INIT_WARN;
module.exports.EVT_READY = EVT_READY;
module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_DESTROYED = EVT_DESTROYED;