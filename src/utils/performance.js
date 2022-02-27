const getIsNodeJS = require("./getIsNodeJS");

/**
 * A common performance object for Node.js and browsers.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Performance}
 *
 * @type {Performance}
 **/
module.exports = (() => {
  let nodeJSPerformance;

  try {
    if (getIsNodeJS()) {
      // IMPORTANT: The usage of eval here fixes "Module not found: Can't
      // resolve 'perf_hooks'" error caused by Webpack from trying to
      // import this, regardless of the conditional value
      nodeJSPerformance = eval('require("perf_hooks").performance');
    }
  } catch (err) {
    console.error(err);
  }

  return nodeJSPerformance || performance;
})();
