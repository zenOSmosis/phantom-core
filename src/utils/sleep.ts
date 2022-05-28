/**
 * Asynchronously pauses execution until the given time has elapsed.
 */
export default async function sleep(time = 1000) {
  await new Promise(resolve => setTimeout(resolve, time));
}
