import PhantomCore, {
  EVT_READY,
  EVT_UPDATED,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIMED_OUT,
  EVT_DESTROYED,
  EVT_NO_INIT_WARN,
} from "./PhantomCore";

export default PhantomCore;

export {
  PhantomCore,
  EVT_READY,
  EVT_UPDATED,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIMED_OUT,
  EVT_DESTROYED,
  EVT_NO_INIT_WARN,
};

import Logger, {
  LOG_LEVEL_TRACE,
  LOG_LEVEL_DEBUG,
  LOG_LEVEL_INFO,
  LOG_LEVEL_WARN,
  LOG_LEVEL_ERROR,
  LOG_LEVEL_SILENT,
} from "./Logger";

export {
  Logger,
  LOG_LEVEL_TRACE,
  LOG_LEVEL_DEBUG,
  LOG_LEVEL_INFO,
  LOG_LEVEL_WARN,
  LOG_LEVEL_ERROR,
  LOG_LEVEL_SILENT,
};

import logger from "./globalLogger";
export { logger };

// Extensions

import ArbitraryPhantomWrapper from "./ArbitraryPhantomWrapper";
export { ArbitraryPhantomWrapper };

import PhantomCollection from "./PhantomCollection";
export { PhantomCollection };

import PhantomServiceCore from "./PhantomServiceCore";
export { PhantomServiceCore };

import PhantomServiceManager from "./PhantomServiceManager";
export { PhantomServiceManager };

import PhantomSerializableState from "./PhantomSerializableState";
export { PhantomSerializableState };

import PhantomState from "./PhantomState";
export { PhantomState };

import FunctionStack from "./FunctionStack";
export { FunctionStack };

// Base utilities

import consume from "./utils/consume";
export { consume };

import deepMerge from "./utils/deepMerge";
export { deepMerge };

import getIsNodeJS from "./utils/getIsNodeJS";
export { getIsNodeJS };

import getPackageJSON from "./utils/getPackageJSON";
export { getPackageJSON };

import getUnixTime from "./utils/getUnixTime";
export { getUnixTime };

import getUptime from "./utils/getUptime";
export { getUptime };

import performance from "./utils/performance";
export { performance };

import shallowMerge from "./utils/shallowMerge";
export { shallowMerge };

import sleep from "./utils/sleep";
export { sleep };

// Utilities for working with JavaScript classes

import autoBindClassInstanceMethods from "./utils/class-utils/autoBindClassInstanceMethods";
export { autoBindClassInstanceMethods };

import getClass from "./utils/class-utils/getClass";
export { getClass };

import getClassInheritance from "./utils/class-utils/getClassInheritance";
export { getClassInheritance };

import getClassInstanceMethodNames from "./utils/class-utils/getClassInstanceMethodNames";
export { getClassInstanceMethodNames };

import getClassInstancePropertyNames from "./utils/class-utils/getClassInstancePropertyNames";
export { getClassInstancePropertyNames };

import getClassName from "./utils/class-utils/getClassName";
export { getClassName };

import getIsClass from "./utils/class-utils/getIsClass";
export { getIsClass };

import getIsClassInstance from "./utils/class-utils/getIsClassInstance";
export { getIsClassInstance };

import getSuperClass from "./utils/class-utils/getSuperClass";
export { getSuperClass };

// Utility for checking PhantomCore (and extension) event exports

import * as eventConstantCheckingUtils from "./utils/testing-utils/eventConstantCheckingUtils";
export { eventConstantCheckingUtils };
