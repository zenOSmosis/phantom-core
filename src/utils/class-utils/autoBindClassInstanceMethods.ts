import getClassInstanceMethodNames from "./getClassInstanceMethodNames";
import getIsClassInstance from "./getIsClassInstance";
import { ClassInstance } from "./types";

/**
 * Force scope binding of JavaScript class methods to the class itself,
 * regardless of how or where the method is invoked.
 *
 * IMPORTANT: Once a method is bound, it cannot be rebound to another class.
 * @see https://stackoverflow.com/a/20925268
 *
 * Additional reading: https://gist.github.com/dfoverdx/2582340cab70cff83634c8d56b4417cd
 */
export default function autoBindClassInstanceMethods(
  classInstance: ClassInstance,
  ignoreMethods: Function[]
): void {
  if (!getIsClassInstance(classInstance)) {
    throw new TypeError("classInstance must be an instance of a class");
  }

  getClassInstanceMethodNames(classInstance).forEach(methodName => {
    const method = classInstance[methodName] as Function;

    if (
      method !== classInstance.constructor &&
      !ignoreMethods.includes(method)
    ) {
      classInstance[methodName] = method.bind(classInstance);
    }
  });
}
