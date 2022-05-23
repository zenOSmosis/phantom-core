import PhantomState, {
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
} from "./PhantomState";
import { isPlainObject } from "is-plain-object";

export {
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
};

/**
 * A simple, object-based state management utility, which piggy-backs off of
 * PhantomState and enforces serializable state so that the state can be
 * transmitted over network, etc.
 */
export default class PhantomSerializableState extends PhantomState {
  /**
   * Serializes the given object into a string.
   */
  static serialize(obj: { [key: string]: unknown }) {
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
   * Converts the given string into an object.
   */
  static unserialize(str: string) {
    return JSON.parse(str);
  }

  /**
   * Sets the next state, using shallow-merge strategy.
   *
   * NOTE: The previous state object will be re-referenced.
   *
   * @emits EVT_UPDATE With partialNextState
   */
  override setState(
    partialNextState: { [key: string]: unknown },
    isMerge = true
  ) {
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
   */
  getSerializedState() {
    return PhantomSerializableState.serialize(this.getState());
  }
}
