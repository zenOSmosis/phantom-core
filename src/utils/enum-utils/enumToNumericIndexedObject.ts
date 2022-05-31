import getIsNumeric from "../getIsNumeric";

// TODO: [3.0.0] Document
export default function enumToNumericIndexedObject(enumeration: {
  [key: string]: string;
}): { [key: string]: string | number } {
  return Object.fromEntries(
    Object.entries(enumeration)
      .filter(([key]) => getIsNumeric(key))
      .map(([key, value]) => [parseInt(key, 10), value])
  );
}
