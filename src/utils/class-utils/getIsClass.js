/**
 * Determines if the given object is a JavaScript class.
 * 
 * @param {Object | function | any} obj 
 * @return {boolean}
 */
module.exports = function getIsClass(obj) {
  return Boolean(typeof obj === 'function' && obj.name)
}