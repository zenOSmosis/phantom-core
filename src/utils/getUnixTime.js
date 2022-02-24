/**
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Performance}
 *
 * @type {Performance}
 **/
const performance = (() => {
  // Fix cross-platform issue between Node.js and browsers
  let libPerformance;
  try {
    const { performance } = require("perf_hooks");
    libPerformance = performance;
  } finally {
    return libPerformance || window.performance;
  }
})();

// Initialize load time with milliseconds since Jan. 1, 1970 (UTC)
const LOAD_TIME = (() => {
  const date = new Date();

  const utc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );

  return utc;
})();

/**
 * Retrieves seconds since midnight January 1, 1970 (UTC).
 *
 * @return {number}
 */
module.exports = function getUnixTime() {
  return Math.round((LOAD_TIME + performance.now()) / 1000);
};
