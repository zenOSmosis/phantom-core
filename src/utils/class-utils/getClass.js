const getIsClassInstance = require("./getIsClassInstance");

/**
 * Retrieves the JavaScript class of the given object instance, or class.
 *
 * If a class is passed in, the original class is returned.
 *
 * @param {function | Object} instanceOrClass
 * @return {function}
 */
module.exports = function getClass(instanceOrClass) {
  const isInstance = getIsClassInstance(instanceOrClass);

  if (isInstance) {
    return instanceOrClass.constructor;
  } else {
    return instanceOrClass;
  }
};
