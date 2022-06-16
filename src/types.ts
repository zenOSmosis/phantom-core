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
  | bigint;

/**
 * A general-purpose (i.e. "plain") object which can contain other general-
 * purpose objects.
 */
export type RecursiveObject = {
  [key: string]:
    | Primitive
    | Primitive[]
    | RecursiveObject
    | RecursiveObject[]
    | Class
    | Class[]
    | ClassInstance
    | ClassInstance[]
    | Instantiable
    | Instantiable[]
    | unknown
    | unknown[];
};

// Types borrowed from: https://github.com/microsoft/TypeScript/issues/17572#issuecomment-319994873
export type Abstract<T = unknown> = (...args: any[]) => any & { prototype: T };
export type Constructor<T = unknown> = new (...args: any[]) => T;
export type Class<T = Constructor> = Abstract<T> | Constructor<T>;

/**
 * A class instance.
 */
export interface ClassInstance {
  constructor: Instantiable;

  [key: string]:
    | Primitive
    | RecursiveObject
    | ((...args: any[]) => any)
    | Instantiable
    | Class
    | ClassInstance
    // TODO: [3.0.0] Fix any type
    | any;
}

/**
 * Type definitions which aren't categorizable, or are suited for general purposes.
 */

export interface Instantiable {
  name: string;

  prototype:
    | ((...args: (Primitive & RecursiveObject)[]) => (...args: any[]) => any)
    | Primitive
    | RecursiveObject;
}

/**
 * Type wrapper for TypeScript Enums.
 *
 * @see https://www.typescriptlang.org/docs/handbook/enums.html
 */
export type Enum<T = string | number> = { [key: string]: T };
