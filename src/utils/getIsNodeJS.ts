// Alternatively, see hostProcess, which checks for browser, electron, and all environments
// @see https://github.com/microsoft/OCR-Form-Tools/blob/master/src/common/hostProcess.ts

/**
 * Determines if the JavaScript runtime is Node.js based or not.
 *
 * @see {@link https://stackoverflow.com/a/35813135}
 */
export default function getIsNodeJS() {
  return typeof process.versions.node !== "undefined";
}
