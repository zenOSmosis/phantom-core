import { Enum } from "../../types";

/**
 * Retrieves the values from a TypeScript Enum.
 */
export default function getEnumValues(obj: Enum): (string | number)[] {
  return Object.values(obj);
}
