const getClass = require("./getClass");

/**
 * Retrieves the JavaScript class name of the given class or class instance.
 *
 * @param {function | Object} instanceOrClass
 * @return {string}
 */
module.exports = function getClassName(instanceOrClass) {
  const JSClass = getClass(instanceOrClass);

  return JSClass.name;
};
