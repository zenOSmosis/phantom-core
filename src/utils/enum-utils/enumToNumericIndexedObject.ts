import { Enum } from "../../types";
import getIsNumeric from "../getIsNumeric";

/**
 * Creates a numerically indexed object from the given enum.
 */
export default function enumToNumericIndexedObject(obj: Enum): {
  [key: string]: string | number;
} {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([key]) => getIsNumeric(key))
      .map(([key, value]) => [parseInt(key, 10), value])
  );
}
