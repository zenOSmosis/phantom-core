/**
 * A common performance object for Node.js and browsers.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Performance}
 *
 * @type {Performance}
 **/
module.exports = (() => {
  // Fix cross-platform issue between Node.js and browsers
  let libPerformance;
  try {
    const { performance } = require("perf_hooks");
    libPerformance = performance;
  } finally {
    // Do nothing (CodeFactor will flag an error if returning here)
  }

  return libPerformance || window.performance;
})();
