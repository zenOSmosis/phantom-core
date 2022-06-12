/**
 * Returns the given string with the first letter converted to lower-case.
 */
export default function toLCFirstLetter(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}
