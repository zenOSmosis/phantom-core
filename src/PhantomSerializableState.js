import PhantomState from "./PhantomState";
import { isPlainObject } from "is-plain-object";

export {
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATED,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIMED_OUT,
  EVT_DESTROYED,
};

/**
 * A simple, object-based state management utility, which piggy-backs off of
 * PhantomState and enforces serializable state so that the state can be
 * transmitted over network, etc.
 */
export default class PhantomSerializableState extends PhantomState {
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
   * @param {boolean} isMerge? [default = true]
   * @emits EVT_UPDATED With partialNextState
   * @return {void}
   */
  setState(partialNextState, isMerge = true) {
    // Run through obj->serial->obj conversion to ensure partial next state can
    // be serialized, while storing it in memory as an object, to enable
    // subsequent partial updates
    partialNextState = PhantomSerializableState.unserialize(
      PhantomSerializableState.serialize(partialNextState)
    );

    return super.setState(partialNextState, isMerge);
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
