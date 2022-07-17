import { RecursiveObject } from "../../types";

/**
 * Determines if two objects have the same shallow values.
 *
 * Algorithm borrowed from, and modified from:
 * @see https://learntechsystems.com/what-is-shallow-comparison-in-js/
 */
export default function shallowCompare(
  predA: RecursiveObject | unknown,
  predB: RecursiveObject | unknown
): boolean {
  // Exact value, definite comparison
  if (predA === predB) {
    return true;
  }

  if (typeof predA === "object" && typeof predB === "object") {
    // ['prop1', 'prop2', 'etc']
    const aProperties = Object.getOwnPropertyNames(predA);
    // ['prop1', 'prop2', 'etc']
    const bProperties = Object.getOwnPropertyNames(predB);

    // Checking the properties array length
    // If the quantity of the properties are not equal
    if (aProperties.length !== bProperties.length) {
      return false; // then the objects are not equals
    }

    // Go through every position in the array
    for (let i = 0; i < aProperties.length; i++) {
      // getting the prop name in that position of the array
      const propName = aProperties[i];

      // Comparing the object values 30, 50
      if (
        (predA as RecursiveObject)[propName] !==
        (predB as RecursiveObject)[propName]
      ) {
        return false;
      }
    }

    return true;
  }

  return false;
}
