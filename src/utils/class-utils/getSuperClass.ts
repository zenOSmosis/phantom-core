import getClass from "./getClass";
import getIsClass from "./getIsClass";
import { Class, ClassInstance } from "../../types";

/**
 * Retrieves the given class instance's parent class.
 */
export default function getSuperClass(
  classOrInstance: Class | ClassInstance
): Class | void {
  const JSClass = getClass(classOrInstance);

  const predicate: Class | null = Object.getPrototypeOf(JSClass);

  if (getIsClass(predicate)) {
    return predicate as Class;
  }
}
