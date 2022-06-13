import PhantomCore from "../PhantomCore";
import { Primitive, RecursiveObject, Class } from "../types";

export type PhantomCollectionChildKey =
  | Primitive
  | RecursiveObject
  | Class
  | Class<PhantomCore>;
