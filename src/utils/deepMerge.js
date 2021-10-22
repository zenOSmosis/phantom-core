const libDeepMerge = require("deepmerge");

/**
 * TODO: Reconsider this; do we really want to deep-merge these init options?
 * It makes things rather limiting.
 *
 * @param {Object} objA? [optional; default = {}]
 * @param {Object} objB? [optional; default = {}]
 * @return {Object} Returns a deep merged clone of options, where
 * userLevelOptions overrides defaultOptions.
 */
module.exports = function deepMerge(objA = {}, objB = {}) {
  // Typecast null options to Object for robustness of implementors (i.e.
  // media-stream-track-controller may pass null when merging optional
  // MediaStreamTrack constraints)
  if (objA === null) objA = {};
  if (objB === null) objB = {};

  return libDeepMerge(objA, objB);
};
