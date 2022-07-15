// TODO: [3.0.0] Document
export default function getIsNumeric(val: unknown): boolean {
  return !isNaN(val as number);
}
