import getIsClassInstance from "./getIsClassInstance";

/**
 * Retrieves an array of the given class property names.
 *
 * IMPORTANT: This retrieves an array of strings, and not pointers to the
 * properties themselves.
 */
// TODO: [3.0.0] Fix any type
export default function getClassInstancePropertyNames(classInstance: any) {
  if (!getIsClassInstance(classInstance)) {
    throw new TypeError("classInstance must be an instance of a class");
  }

  const properties = new Set();

  let currentObj = classInstance;
  do {
    Object.getOwnPropertyNames(currentObj).map(item => properties.add(item));
  } while ((currentObj = Object.getPrototypeOf(currentObj)));

  return [...properties.keys()];
}
