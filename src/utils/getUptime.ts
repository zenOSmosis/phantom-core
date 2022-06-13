import getUnixTime from "./getUnixTime";

const startTime = getUnixTime();

/**
 * Returns the number of seconds since this module was loaded.
 */
export default function getUptime(): number {
  const now = getUnixTime();

  return now - startTime;
}
