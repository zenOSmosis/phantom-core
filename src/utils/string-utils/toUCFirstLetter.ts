/**
 * Returns the given string with the first letter converted to upper-case.
 */
export default function toUCFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
