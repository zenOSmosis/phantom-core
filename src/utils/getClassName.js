const getIsClassInstance = require("./getIsClassInstance");

/**
 * @param {Object} instanceOrClass
 * @return {string}
 */
module.exports = function getClassName(instanceOrClass) {
  const isInstance = getIsClassInstance(instanceOrClass);

  if (isInstance) {
    return instanceOrClass.constructor.name;
  } else {
    return instanceOrClass.name;
  }
};
