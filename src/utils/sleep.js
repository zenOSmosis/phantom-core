/**
 * Asynchronously pauses execution until the given time has elapsed.
 *
 * @param {number} time? [default = 1000] Milliseconds worth of sleep time.
 * @return {Promise<void>} Resolves when sleep cycle has finished
 */
module.exports = async function sleep(time = 1000) {
  await new Promise(resolve => setTimeout(resolve, time));
};
