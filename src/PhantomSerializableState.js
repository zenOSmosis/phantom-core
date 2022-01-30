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
  EVT_BEFORE_DESTROY,
  /** @export */
  EVT_DESTROYED,
} = PhantomState;

/**
 * A simple, object-based state management utility, which piggy-backs off of
 * PhantomState and enforces serializable state so that the state can be
 * transmitted over network, etc.
 */
class PhantomSerializableState extends PhantomState {
  /**
   * Serializes the given object into a string.
   *
   * @param {Object} obj
   * @return {string}
   */
  static serialize(obj) {
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

  /**
   * Converts the given string into an Object.
   *
   * @param {string} str
   * @return {Object}
   */
  static unserialize(str) {
    return JSON.parse(str);
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
    // Run through obj->serial->obj conversion to ensure partial next state can
    // be serialized, while storing it in memory as an object, to enable
    // subsequent partial updates
    partialNextState = PhantomSerializableState.unserialize(
      PhantomSerializableState.serialize(partialNextState)
    );

    return super.setState(partialNextState);
  }

  /**
   * Retrieves the current state, as a serialized string.
   *
   * @return {string}
   */
  getSerializedState() {
    return PhantomSerializableState.serialize(this.getState());
  }
}

module.exports = PhantomSerializableState;
module.exports.EVT_NO_INIT_WARN = EVT_NO_INIT_WARN;
module.exports.EVT_READY = EVT_READY;
module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_BEFORE_DESTROY = EVT_BEFORE_DESTROY;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
