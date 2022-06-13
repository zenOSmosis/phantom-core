export type CommonOptions = {
  isAsync?: boolean;
  logLevel?: number;
  title?: string | null;
  hasAutomaticBindings?: boolean;
};

export type EventConstant = `EVT_${string}`;
