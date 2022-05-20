/**
 * Consumes a variable without using it.
 */
export default function consume(obj: unknown): void {
  return obj ? undefined : undefined;
}
