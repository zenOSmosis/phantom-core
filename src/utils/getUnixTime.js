/**
 * Retrieves seconds since midnight Jan. 1, 1970 (UTC).
 *
 * @return {number}
 */
module.exports = function getUnixTime() {
  const date = new Date();

  const utc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );

  return Math.round(utc / 1000);
};
