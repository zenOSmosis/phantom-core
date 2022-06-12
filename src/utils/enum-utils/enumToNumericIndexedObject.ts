import { Enum } from "../../types";
import getIsNumeric from "../getIsNumeric";

/**
 * Creates a numerically indexed object from the given enum.
 *
 * Note: Due to JavaScript language design the keys are still a string type,
 * but a numeric representation.
 */
export default function enumToNumericIndexedObject(obj: Enum): {
  [key: string]: string | number;
} {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([key]) => getIsNumeric(key))
      .map(([key, value]) => [key, value])
  );
}
