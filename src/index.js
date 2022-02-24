const PhantomCore = require("./PhantomCore");
const {
  EVT_READY,
  EVT_UPDATED,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIMED_OUT,
  EVT_DESTROYED,
  EVT_NO_INIT_WARN,
} = PhantomCore;
const Logger = require("./Logger");
const {
  LOG_LEVEL_TRACE,
  LOG_LEVEL_DEBUG,
  LOG_LEVEL_INFO,
  LOG_LEVEL_WARN,
  LOG_LEVEL_ERROR,
  LOG_LEVEL_SILENT,
} = Logger;

module.exports = PhantomCore;

Object.assign(module.exports, {
  EVT_READY,
  EVT_UPDATED,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIMED_OUT,
  EVT_DESTROYED,
  EVT_NO_INIT_WARN,
  Logger,

  // Global logger instance
  logger: require("./globalLogger"),

  LOG_LEVEL_TRACE,
  LOG_LEVEL_DEBUG,
  LOG_LEVEL_INFO,
  LOG_LEVEL_WARN,
  LOG_LEVEL_ERROR,
  LOG_LEVEL_SILENT,

  ArbitraryPhantomWrapper: require("./ArbitraryPhantomWrapper"),
  PhantomCollection: require("./PhantomCollection"),
  PhantomServiceCore: require("./PhantomServiceCore"),
  PhantomServiceManager: require("./PhantomServiceManager"),
  PhantomSerializableState: require("./PhantomSerializableState"),
  PhantomState: require("./PhantomState"),

  FunctionStack: require("./FunctionStack"),

  // Base utilities
  consume: require("./utils/consume"),
  deepMerge: require("./utils/deepMerge"),
  getIsNodeJS: require("./utils/getIsNodeJS"),
  getPackageJSON: require("./utils/getPackageJSON"),
  getUnixTime: require("./utils/getUnixTime"),
  getUptime: require("./utils/getUptime"),
  performance: require("./utils/performance"),
  shallowMerge: require("./utils/shallowMerge"),
  sleep: require("./utils/sleep"),

  // Utilities for working with JavaScript classes
  autoBindClassInstanceMethods: require("./utils/class-utils/autoBindClassInstanceMethods"),
  getClass: require("./utils/class-utils/getClass"),
  getClassInheritance: require("./utils/class-utils/getClassInheritance"),
  getClassInstanceMethodNames: require("./utils/class-utils/getClassInstanceMethodNames"),
  getClassInstancePropertyNames: require("./utils/class-utils/getClassInstancePropertyNames"),
  getClassName: require("./utils/class-utils/getClassName"),
  getIsClass: require("./utils/class-utils/getIsClass"),
  getIsClassInstance: require("./utils/class-utils/getIsClassInstance"),
  getSuperClass: require("./utils/class-utils/getSuperClass"),

  // Utility for checking PhantomCore (and extension) event exports
  eventConstantCheckingUtils: require("./utils/testing-utils/eventConstantCheckingUtils"),
});
