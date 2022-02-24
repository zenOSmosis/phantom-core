const performance = require("./performance");

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
