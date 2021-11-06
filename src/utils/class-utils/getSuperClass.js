const getClass = require("./getClass");
const getIsClass = require('./getIsClass')

/**
 * Retrieves the given class instance's super class.
 *
 * @param {function | Object} classOrInstance A JavaScript class or an instance
 * of one
 * @return {function | void} Non-instantiated super class
 */
module.exports = function getSuperClass(classOrInstance) {
  const JSClass = getClass(classOrInstance);

  const predicate = Object.getPrototypeOf(JSClass);

  if (getIsClass(predicate)) {
    return predicate
  }
};
