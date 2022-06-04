import getClassInstancePropertyNames from "./getClassInstancePropertyNames";
import { ClassInstance } from "../../types";

/**
 * Retrieves an array of class method names for the given JavaScript class.
 *
 * IMPORTANT: This retrieves an array of strings, and not pointers to the
 * methods themselves.
 */
export default function getClassInstanceMethodNames(
  classInstance: ClassInstance
): string[] {
  const propertyNames = getClassInstancePropertyNames(classInstance);

  return propertyNames.filter(
    item =>
      typeof (classInstance as { [key: string]: any })[item] === "function"
  );
}
