const getClassMethodNames = require("./getClassMethodNames");
const getIsClassInstance = require("./getIsClassInstance");

/**
 * Force scope binding of class methods to the class itself, regardless of how
 * the method is invoked.
 *
 * Additional reading: https://gist.github.com/dfoverdx/2582340cab70cff83634c8d56b4417cd
 *
 * @param {function} classInstance JavaScript class
 * @param {function[]} ignoreMethods? An array of class methods to ignore.
 * These must be references to the actual method and not the method names
 * themselves.
 * @return {void}
 */
module.exports = function autoBindClassMethods(
  classInstance,
  ignoreMethods = []
) {
  if (!getIsClassInstance(classInstance)) {
    throw new TypeError("classInstance must be an instance of a class");
  }

  getClassMethodNames(classInstance).forEach(methodName => {
    const method = classInstance[methodName];

    if (
      method !== classInstance.constructor &&
      !ignoreMethods.includes(method)
    ) {
      classInstance[methodName] = classInstance[methodName].bind(classInstance);
    }
  });
};
