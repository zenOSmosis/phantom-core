import getSuperClass from "./getSuperClass";

/**
 * Retrieves an array of JavaScript classes which form the inheritance of the
 * given instanceOrClass.
 */
export default function getClassInheritance(instanceOrClass: Function) {
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
