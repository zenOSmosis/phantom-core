import getClass from "./getClass";
import getIsClass from "./getIsClass";
import { Class, ClassInstance } from "./types";

/**
 * Retrieves the given class instance's parent class.
 */
export default function getSuperClass(classOrInstance: Class | ClassInstance) {
  const JSClass = getClass(classOrInstance);

  const predicate = Object.getPrototypeOf(JSClass);

  if (getIsClass(predicate)) {
    return predicate;
  }
}
