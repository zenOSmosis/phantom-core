const getClassInstanceMethodNames = require("./getClassInstanceMethodNames");
const getIsClassInstance = require("./getIsClassInstance");

/**
 * Force scope binding of JavaScript class methods to the class itself,
 * regardless of how or where the method is invoked.
 *
 * IMPORTANT: Once a method is bound, it cannot be rebound to another class.
 * @see https://stackoverflow.com/a/20925268
 *
 * Additional reading: https://gist.github.com/dfoverdx/2582340cab70cff83634c8d56b4417cd
 *
 * @param {function} classInstance JavaScript class
 * @param {function[]} ignoreMethods? An array of class methods to ignore.
 * These must be references to the actual method and not the method names
 * themselves.
 * @return {void}
 */
module.exports = function autoBindClassInstanceMethods(
  classInstance,
  ignoreMethods = []
) {
  if (!getIsClassInstance(classInstance)) {
    throw new TypeError("classInstance must be an instance of a class");
  }

  getClassInstanceMethodNames(classInstance).forEach(methodName => {
    const method = classInstance[methodName];

    if (
      method !== classInstance.constructor &&
      !ignoreMethods.includes(method)
    ) {
      classInstance[methodName] = classInstance[methodName].bind(classInstance);
    }
  });
};
