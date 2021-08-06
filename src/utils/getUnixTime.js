/**
 * Retrieves seconds since midnight January 1, 1970, in UTC time.
 *
 * @return {number}
 */
function getUnixTime() {
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
