import getClassInstancePropertyNames from "./getClassInstancePropertyNames";

/**
 * Retrieves an array of class method names for the given JavaScript class.
 *
 * IMPORTANT: This retrieves an array of strings, and not pointers to the
 * methods themselves.
 */
// TODO: [3.0.0] Fix any type
export default function getClassInstanceMethodNames(classInstance: any) {
  const propertyNames = getClassInstancePropertyNames(classInstance);

  return propertyNames.filter(
    item => typeof classInstance[item] === "function"
  );
}
