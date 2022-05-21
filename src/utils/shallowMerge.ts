/**
 * Shallow-merges two objects together.
 *
 * IMPORTANT: The return is a COPY of the merged; no re-assignment takes place.
 *
 * Returns a shallow-merged clone of objects, where objB overrides objA.
 */
module.exports = function shallowMerge(objA = {}, objB = {}) {
  // Typecast null options to Object for robustness of implementors (i.e.
  // media-stream-track-controller may pass null when merging optional
  // MediaStreamTrack constraints)
  if (objA === null) objA = {};
  if (objB === null) objB = {};

  return { ...objA, ...objB };
};
