import { RecursiveObject } from "../../types";

/**
 * Shallow-merges two objects together.
 *
 * IMPORTANT: The return is a COPY of the merged; no re-assignment takes place.
 *
 * Returns a shallow-merged clone of objects, where objB overrides objA.
 *
 * If a null value is utilized for either objA or objB, it will be replaced
 * with an empty object.
 */
export default function shallowMerge(
  objA: RecursiveObject | null = {},
  objB: RecursiveObject | null = {}
): RecursiveObject {
  // Typecast null options to Object for robustness of implementors (i.e.
  // media-stream-track-controller may pass null when merging optional
  // MediaStreamTrack constraints)
  if (objA === null) objA = {};
  if (objB === null) objB = {};

  return { ...objA, ...objB };
}
