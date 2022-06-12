import { Enum } from "../../types";
import getIsNumeric from "../getIsNumeric";

/**
 * Creates a string indexed object from the given enum.
 *
 * Note: The first letter of each key will be lower-case.
 */
export default function enumToStringIndexedObject(obj: Enum): {
  [key: string]: string | number;
} {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([key]) => !getIsNumeric(key))
      .map(([key, value]) => [
        key.charAt(0).toLowerCase() + key.slice(1),
        value,
      ])
  );
}
