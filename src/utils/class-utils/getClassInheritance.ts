import getSuperClass from "./getSuperClass";
import { Class, ClassInstance } from "./types";

/**
 * Retrieves an array of JavaScript classes which form the inheritance of the
 * given instanceOrClass.
 */
export default function getClassInheritance(
  instanceOrClass: Class | ClassInstance
) {
  const parents = [];

  let predicate = instanceOrClass;
  do {
    predicate = getSuperClass(predicate);

    if (predicate) {
      parents.push(predicate);
    }
  } while (predicate);

  return parents;
}
