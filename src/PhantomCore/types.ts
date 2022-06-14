import { RecursiveObject } from "../types";

export type CommonOptions<T = RecursiveObject> = {
  isAsync?: boolean;
  logLevel?: number;
  title?: string | null;
  hasAutomaticBindings?: boolean;
} & T;

export type EventConstant = `EVT_${string}`;
