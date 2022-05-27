import getIsClassInstance from "./getIsClassInstance";
import { Class, ClassInstance } from "./types";

/**
 * Retrieves the JavaScript class of the given object instance, or class.
 *
 * If a class is passed in, the original class is returned.
 */
export default function getClass(
  instanceOrClass: Class | ClassInstance
): Class {
  const isInstance = getIsClassInstance(instanceOrClass);

  if (isInstance) {
    return instanceOrClass.constructor;
  } else {
    return instanceOrClass as Class;
  }
}
