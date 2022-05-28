import getIsClassInstance from "./getIsClassInstance";
import { ClassInstance } from "./types";

/**
 * Retrieves an array of the given class property names.
 *
 * IMPORTANT: This retrieves an array of strings, and not pointers to the
 * properties themselves.
 */
export default function getClassInstancePropertyNames(
  classInstance: ClassInstance
): string[] {
  if (!getIsClassInstance(classInstance)) {
    throw new TypeError("classInstance must be an instance of a class");
  }

  const properties = new Set();

  let currentObj = classInstance;
  do {
    Object.getOwnPropertyNames(currentObj).map(item => properties.add(item));
  } while ((currentObj = Object.getPrototypeOf(currentObj)));

  return [...properties.keys()] as string[];
}
