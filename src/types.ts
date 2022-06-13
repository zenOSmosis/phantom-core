/**
 * Data that is not an object and has no methods or properties.
 *
 * @see https://developer.mozilla.org/en-US/docs/Glossary/Primitive
 */
export type Primitive =
  | number
  | string
  | boolean
  | null
  | undefined
  | symbol
  | bigint
  | RecursiveObject;

/**
 * A general-purpose (i.e. "plain") object which can contain other general-
 * purpose objects.
 */
export type RecursiveObject = {
  [key: string]: Primitive;
};

// TODO: [3.0.0] See https://github.com/sindresorhus/type-fest/blob/main/test-d/class.ts
// Borrowed from: https://stackoverflow.com/questions/39392853/is-there-a-type-for-class-in-typescript-and-does-any-include-it
export type Class<T = Instantiable> = Instantiable | T;

/**
 * A class instance.
 */
export interface ClassInstance {
  constructor: Instantiable;

  [key: string]:
    | Primitive
    | RecursiveObject
    | Function
    | Instantiable
    | Class
    | ClassInstance
    // TODO: [3.0.0] Fix any type
    | any;
}

/**
 * Type definitions which aren't categorizable, or are suited for general purposes.
 */

interface Instantiable {
  name: string;

  prototype: ((...args: Primitive[]) => Function) | Primitive | RecursiveObject;
}

/**
 * Type wrapper for TypeScript Enums.
 *
 * @see https://www.typescriptlang.org/docs/handbook/enums.html
 */
export type Enum<T = string | number> = { [key: string]: T };
