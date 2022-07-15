/**
 * Retrieves seconds since midnight Jan. 1, 1970 (UTC).
 *
 * Related [potential] performance issue:
 * @see https://github.com/zenOSmosis/phantom-core/issues/127
 */
export default function getUnixTime(): number {
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
}
