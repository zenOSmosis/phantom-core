const getUnixTime = require("./getUnixTime");

const startTime = getUnixTime();

/**
 * Returns the number of seconds since this module was loaded.
 *
 * @return {number}
 */
function getUptime() {
  const now = getUnixTime();

  return now - startTime;
}

module.exports = getUptime;
