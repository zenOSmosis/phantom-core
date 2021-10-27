const getClassPropertyNames = require("./getClassPropertyNames");
const getIsClassInstance = require("./getIsClassInstance");

/**
 * Retrieves an array of the given class method names.
 *
 * @param {function} classInstance JavaScript class instance.
 * @return {string[]} An array of method names.
 */
module.exports = function getClassMethodNames(classInstance) {
  if (!getIsClassInstance(classInstance)) {
    throw new TypeError("classInstance must be an instance of a class");
  }

  const propertyNames = getClassPropertyNames(classInstance);

  return propertyNames.filter(
    item => typeof classInstance[item] === "function"
  );
};
