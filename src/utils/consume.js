/**
 * Consumes a variable without using it.
 *
 * @param {any} obj
 * @return {void}
 */
module.exports = function consume(obj) {
  return obj ? undefined : undefined;
};
