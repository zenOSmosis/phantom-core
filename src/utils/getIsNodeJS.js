/**
 * Determines if process is running in Node.js or not.
 *
 * Borrowed from: https://github.com/iliakan/detect-node
 *
 * FIXME: (jh) This should be checked using a combination of compiled FE / BE
 * environments, in service workers, web workers, etc.
 *
 * @return {Boolean}
 */
module.exports = function getIsNodeJS() {
  return (
    Object.prototype.toString.call(
      typeof process !== "undefined" ? process : 0
    ) === "[object process]"
  );
};