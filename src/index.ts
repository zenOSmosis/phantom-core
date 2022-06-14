export * from "./types";

import PhantomCore, {
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
  EVT_NO_INIT_WARN,
  CommonOptions,
  EventConstant,
  EventTypes,
} from "./PhantomCore";

export default PhantomCore;
export type { CommonOptions, EventConstant };

export {
  PhantomCore,
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
  EVT_NO_INIT_WARN,
  EventTypes,
};

import Logger, { LogLevel, EVT_LOG_MISS } from "./Logger";

export { Logger, LogLevel, EVT_LOG_MISS };

import globalLogger from "./globalLogger";
export { globalLogger };

import CommonEventEmitter, { EventListener } from "./CommonEventEmitter";
export { CommonEventEmitter };
export type { EventListener };

// Extensions

import ArbitraryPhantomWrapper from "./ArbitraryPhantomWrapper";
export { ArbitraryPhantomWrapper };

// TODO: [3.x] Use package.json exports (requires TypeScript 4.7)
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

import PhantomWatcher, {
  EVT_PHANTOM_WATCHER_LOG_MISS,
  LogMissCounts,
  LogMissCountIndex,
} from "./PhantomWatcher";
export { PhantomWatcher, EVT_PHANTOM_WATCHER_LOG_MISS };
export type { LogMissCounts, LogMissCountIndex };

// Stacks

import FunctionStack from "./stacks/FunctionStack";
export { FunctionStack };

import EventProxyStack, {
  EventProxyStackBindTypes,
} from "./stacks/EventProxyStack";
export { EventProxyStack, EventProxyStackBindTypes };

import TimerStack, { TimerType } from "./stacks/TimerStack";
export { TimerStack, TimerType };

// Base utilities

import consume from "./utils/consume";
export { consume };

import deepMerge from "./utils/object-utils/deepMerge";
export { deepMerge };

import getIsNodeJS from "./utils/getIsNodeJS";
export { getIsNodeJS };

import getIsNumeric from "./utils/getIsNumeric";
export { getIsNumeric };

import getPackageJSON from "./utils/getPackageJSON";
export { getPackageJSON };

import getUnixTime from "./utils/getUnixTime";
export { getUnixTime };

import getUptime from "./utils/getUptime";
export { getUptime };

import shallowMerge from "./utils/object-utils/shallowMerge";
export { shallowMerge };

import sleep from "./utils/sleep";
export { sleep };

// JavaScript class utilities

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

// Enumeration utilities

import enumToNumericIndexedObject from "./utils/enum-utils/enumToNumericIndexedObject";
export { enumToNumericIndexedObject };

import enumToMap, {
  ENUM_MAP_KEY,
  ENUM_MAP_VALUE,
} from "./utils/enum-utils/enumToMap";
export { enumToMap };
export type { ENUM_MAP_KEY, ENUM_MAP_VALUE };

import enumToStringIndexedObject from "./utils/enum-utils/enumToStringIndexedObject";
export { enumToStringIndexedObject };

import getEnumValues from "./utils/enum-utils/getEnumValues";
export { getEnumValues };

// String utilities

import toLCFirstLetter from "./utils/string-utils/toLCFirstLetter";
import toUCFirstLetter from "./utils/string-utils/toUCFirstLetter";
export { toLCFirstLetter, toUCFirstLetter };

// PhantomCore event utilities

// TODO: [3.x] Use package.json exports (requires TypeScript 4.7)
// @see https://github.com/microsoft/TypeScript/issues/33079
// @see https://github.com/zenOSmosis/phantom-core/issues/98
import {
  checkEvents,
  extractEvents,
  compareExportedEvents,
  checkEventValue,
} from "./utils/testing-utils/eventCheckingUtils";
export { checkEventValue, checkEvents, extractEvents, compareExportedEvents };
