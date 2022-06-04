import libDeepMerge from "deepmerge";
import { RecursiveObject } from "../../types";

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
 * Returns a deep-merged clone of objects, where objB overrides objA.
 *
 * If a null value is utilized for either objA or objB, it will be replaced
 * with an empty object.
 */
export default function deepMerge(
  objA: RecursiveObject | null = {},
  objB: RecursiveObject | null = {}
): RecursiveObject {
  // Typecast null options to Object for robustness of implementors (i.e.
  // media-stream-track-controller may pass null when merging optional
  // MediaStreamTrack constraints)
  if (objA === null) objA = {};
  if (objB === null) objB = {};

  return libDeepMerge(objA, objB);
}
