import getIsNodeJS from "./getIsNodeJS";

/**
 * A common performance object for Node.js and browsers.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Performance}
 **/
const nativePerformance: Performance = (() => {
  let nodeJSPerformance;
  let windowPerformance;
  let globalPerformance;

  try {
    if (getIsNodeJS()) {
      // IMPORTANT: The usage of eval here fixes "Module not found: Can't
      // resolve 'perf_hooks'" error caused by Webpack from trying to
      // import this, regardless of the conditional value
      nodeJSPerformance = eval('require("perf_hooks").performance');
    }
  } catch (err) {
    console.error(err);
  } finally {
    if (typeof window !== "undefined") {
      windowPerformance = window.performance;
    } else if (typeof global !== "undefined") {
      globalPerformance = globalPerformance;
    }
  }

  return nodeJSPerformance || windowPerformance || globalPerformance;
})();

export default nativePerformance;
