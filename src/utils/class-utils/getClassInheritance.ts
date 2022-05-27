import getSuperClass from "./getSuperClass";
import { Class, ClassInstance } from "./types";

/**
 * Retrieves an array of JavaScript classes which form the inheritance of the
 * given instanceOrClass.
 */
export default function getClassInheritance(
  instanceOrClass: Class | ClassInstance
): Class[] {
  const parents: Class[] = [];

  let predicate = instanceOrClass;
  do {
    predicate = getSuperClass(predicate);

    if (predicate) {
      parents.push(predicate as Class);
    }
  } while (predicate);

  return parents;
}
