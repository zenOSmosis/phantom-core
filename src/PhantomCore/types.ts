import { RecursiveObject } from "../types";
import PhantomCore from "./PhantomCore";
export interface PhantomCoreExtension extends PhantomCore {}

export type CommonOptions<T = RecursiveObject> = {
  isAsync?: boolean;
  logLevel?: number;
  title?: string | null;
  hasAutomaticBindings?: boolean;
} & T;

export type EventConstant = `EVT_${string}`;
