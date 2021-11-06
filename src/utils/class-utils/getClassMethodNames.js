const getClassPropertyNames = require("./getClassPropertyNames");

/**
 * Retrieves an array of class method names for the given JavaScript class.
 *
 * IMPORTANT: This retrieves an array of strings, and not pointers to the
 * methods themselves.
 *
 * @param {function} classInstance JavaScript class instance
 * @return {string[]} An array of method names
 */
module.exports = function getClassMethodNames(classInstance) {
  const propertyNames = getClassPropertyNames(classInstance);

  return propertyNames.filter(
    item => typeof classInstance[item] === "function"
  );
};
