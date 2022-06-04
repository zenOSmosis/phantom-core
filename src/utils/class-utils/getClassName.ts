import getClass from "./getClass";
import { Class, ClassInstance } from "../../types";

/**
 * Retrieves the JavaScript class name of the given class or class instance.
 */
export default function getClassName(
  instanceOrClass: Class | ClassInstance
): string {
  const JSClass = getClass(instanceOrClass);

  return JSClass.name;
}
