import PhantomCore, {
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
  EVT_NO_INIT_WARN,
  CommonOptions,
} from "./PhantomCore";

export default PhantomCore;
export type { CommonOptions };

export {
  PhantomCore,
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
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

import CommonEventEmitter from "./CommonEventEmitter";
export { CommonEventEmitter };

// Extensions

import ArbitraryPhantomWrapper from "./ArbitraryPhantomWrapper";
export { ArbitraryPhantomWrapper };

// FIXME: Use package.json exports once TypeScript is bumped to 4.7
// @see https://github.com/microsoft/TypeScript/issues/33079
// @see https://github.com/zenOSmosis/phantom-core/issues/98
import PhantomCollection, {
  EVT_CHILD_INSTANCE_ADD,
  EVT_CHILD_INSTANCE_REMOVE,
} from "./PhantomCollection";
export { PhantomCollection, EVT_CHILD_INSTANCE_ADD, EVT_CHILD_INSTANCE_REMOVE };

import PhantomServiceCore from "./PhantomServiceCore";
export { PhantomServiceCore };

import PhantomServiceManager from "./PhantomServiceManager";
export { PhantomServiceManager };

import PhantomSerializableState from "./PhantomSerializableState";
export { PhantomSerializableState };

import PhantomState from "./PhantomState";
export { PhantomState };

import PhantomWatcher from "./PhantomWatcher";
export { PhantomWatcher };

// Stacks

import FunctionStack from "./stacks/FunctionStack";
export { FunctionStack };

import EventProxyStack from "./stacks/EventProxyStack";
export { EventProxyStack };

import TimerStack, { TimerType } from "./stacks/TimerStack";
export { TimerStack, TimerType };

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
