/**
 * Determines if the given object is a JavaScript class.
 */
export default function getIsClass(obj: unknown) {
  return Boolean(typeof obj === "function" && obj.name);
}
