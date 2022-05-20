import getClass from "./getClass";

/**
 * Retrieves the JavaScript class name of the given class or class instance.
 */
export default function getClassName(instanceOrClass: Function) {
  const JSClass = getClass(instanceOrClass);

  return JSClass.name;
}
