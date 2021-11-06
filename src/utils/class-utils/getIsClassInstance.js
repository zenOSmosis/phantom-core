/**
 * Determines if the given object is a class instance.
 *
 * @param {Object} instanceOrClass
 * @return {boolean}
 */
module.exports = function getIsClassInstance(instanceOrClass) {
  // @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getPrototypeOf
  // If a polyfill for getPrototypeOf is needed, look here: https://github.com/zloirock/core-js#ecmascript-object
  return Boolean(typeof Object.getPrototypeOf(instanceOrClass) === "object");
};
