import getClass from "./getClass";
import getIsClass from "./getIsClass";

/**
 * Retrieves the given class instance's super class.
 */
export default function getSuperClass(classOrInstance: Function) {
  const JSClass = getClass(classOrInstance);

  const predicate = Object.getPrototypeOf(JSClass);

  if (getIsClass(predicate)) {
    return predicate;
  }
}
