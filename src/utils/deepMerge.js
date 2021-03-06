const libDeepMerge = require("deepmerge");

// Potential lib replacements if the performance is low:
// (NOTE: (jh) I haven't looked into these much but the idea of smart merging
// sounds nice if it really boosts the performance)
//
//  - https://www.npmjs.com/package/deepmerge-ts
//  - https://www.npmjs.com/package/object-accumulator

/**
 * Deep-merges two objects together.
 *
 * IMPORTANT: The return is a COPY of the merged; no re-assignment takes place.
 *
 * @param {Object} objA? [optional; default = {}]
 * @param {Object} objB? [optional; default = {}]
 * @return {Object} Returns a deep-merged clone of objects, where
 * objB overrides objA.
 */
module.exports = function deepMerge(objA = {}, objB = {}) {
  // Typecast null options to Object for robustness of implementors (i.e.
  // media-stream-track-controller may pass null when merging optional
  // MediaStreamTrack constraints)
  if (objA === null) objA = {};
  if (objB === null) objB = {};

  return libDeepMerge(objA, objB);
};
