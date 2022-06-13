import { Enum } from "../../types";
import getIsNumeric from "../getIsNumeric";
import toLCFirstLetter from "../string-utils/toLCFirstLetter";

export type ENUM_MAP_KEY = string | number;
export type ENUM_MAP_VALUE = string | number;

/**
 * Creates a map from the given enum, with forward and reverse mappings.
 *
 * Note: The first letter of each string-based key and value will be lower-
 * case.
 */
export default function enumToMap(
  obj: Enum
): Map<ENUM_MAP_KEY, ENUM_MAP_VALUE> {
  return new Map(
    Object.entries(obj).map(([key, value]) => [
      getIsNumeric(key) ? parseInt(key, 10) : toLCFirstLetter(key),
      getIsNumeric(value) ? value : toLCFirstLetter(value as string),
    ])
  );
}
