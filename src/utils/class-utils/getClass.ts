import getIsClassInstance from "./getIsClassInstance";

/**
 * Retrieves the JavaScript class of the given object instance, or class.
 *
 * If a class is passed in, the original class is returned.
 */
export default function getClass(instanceOrClass: Function) {
  const isInstance = getIsClassInstance(instanceOrClass);

  if (isInstance) {
    return instanceOrClass.constructor;
  } else {
    return instanceOrClass;
  }
}
