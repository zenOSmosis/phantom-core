const getClass = require("./getClass");

/**
 * @param {Object} instanceOrClass
 * @return {string}
 */
module.exports = function getClassName(instanceOrClass) {
  const reservedWord_class = getClass(instanceOrClass);

  return reservedWord_class.name;
};
