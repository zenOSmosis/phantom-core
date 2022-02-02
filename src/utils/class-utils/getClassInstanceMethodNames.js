const getClassInstancePropertyNames = require("./getClassInstancePropertyNames");

/**
 * Retrieves an array of class method names for the given JavaScript class.
 *
 * IMPORTANT: This retrieves an array of strings, and not pointers to the
 * methods themselves.
 *
 * @param {Function} classInstance JavaScript class instance
 * @return {string[]} An array of method names
 */
module.exports = function getClassInstanceMethodNames(classInstance) {
  const propertyNames = getClassInstancePropertyNames(classInstance);

  return propertyNames.filter(
    item => typeof classInstance[item] === "function"
  );
};
