/**
 * Retrieves seconds since midnight January 1, 1970, in UTC time.
 *
 * @return {number}
 */
function getUnixTime() {
  // FIXME: (jh) Would this benefit to take the current unix time at the
  // beginning of the module include and calculate the high resolution time
  // offset following that?
  // Related issue: https://github.com/zenOSmosis/phantom-core/issues/127

  const date = new Date();

  const utc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );

  const unixTime = Math.round(utc / 1000);

  return unixTime;
}

module.exports = getUnixTime;
