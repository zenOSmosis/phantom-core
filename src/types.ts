/**
 * Type definitions which aren't categorizable, or are suited for general purposes.
 */

interface Instantiable {
  name: string;

  // TODO: [3.0.0] Fix any type
  prototype: (...args: any[]) => unknown;
}

// Borrowed from: https://stackoverflow.com/questions/39392853/is-there-a-type-for-class-in-typescript-and-does-any-include-it
export type Class<T = Instantiable> = Instantiable | T;

export interface ClassInstance {
  constructor: Instantiable;

  // TODO: [3.0.0] Fix any type
  [key: string]: any;
}
