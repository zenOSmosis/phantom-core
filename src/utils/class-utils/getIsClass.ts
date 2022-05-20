import { Class, ClassInstance } from "./types";

/**
 * Determines if the given object is a JavaScript class.
 */
export default function getIsClass(obj: Class | ClassInstance | any) {
  return Boolean(typeof obj === "function" && obj.name);
}
