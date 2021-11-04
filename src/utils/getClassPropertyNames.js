const getIsClassInstance = require("./getIsClassInstance");

/**
 * Retrieves an array of the given class property names.
 *
 * @param {function} classInstance JavaScript class instance.
 * @return {string[]} An array of property names.
 */
module.exports = function getClassPropertyNames(classInstance) {
  if (!getIsClassInstance(classInstance)) {
    throw new TypeError("classInstance must be an instance of a class");
  }

  const properties = new Set();

  let currentObj = classInstance;
  do {
    Object.getOwnPropertyNames(currentObj).map(item => properties.add(item));
  } while ((currentObj = Object.getPrototypeOf(currentObj)));

  return [...properties.keys()];
};
