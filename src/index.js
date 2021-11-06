const PhantomCore = require("./PhantomCore");
const { EVT_READY, EVT_UPDATED, EVT_DESTROYED, EVT_NO_INIT_WARN } = PhantomCore;

module.exports = PhantomCore
module.exports.EVT_READY = EVT_READY;
module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
module.exports.EVT_NO_INIT_WARN = EVT_NO_INIT_WARN;

module.exports.PhantomCollection = require("./PhantomCollection");
module.exports.PhantomServiceManager = require("./PhantomServiceManager");
module.exports.PhantomServiceCore = require("./PhantomServiceCore");
module.exports.PhantomState = require("./PhantomState");
module.exports.PhantomSerializableState = require("./PhantomSerializableState");

module.exports.Logger = require("./Logger");
const {
  LOG_LEVEL_TRACE,
  LOG_LEVEL_DEBUG,
  LOG_LEVEL_INFO,
  LOG_LEVEL_WARN,
  LOG_LEVEL_ERROR,
  LOG_LEVEL_SILENT,
} = module.exports.Logger;

module.exports.LOG_LEVEL_TRACE = LOG_LEVEL_TRACE;
module.exports.LOG_LEVEL_DEBUG = LOG_LEVEL_DEBUG;
module.exports.LOG_LEVEL_INFO = LOG_LEVEL_INFO;
module.exports.LOG_LEVEL_WARN = LOG_LEVEL_WARN;
module.exports.LOG_LEVEL_ERROR = LOG_LEVEL_ERROR;
module.exports.LOG_LEVEL_SILENT = LOG_LEVEL_SILENT;

// Independent logger (outside of PhantomCore instance; used instead of
// console.log)
module.exports.logger = new module.exports.Logger()

module.exports.getUnixTime = require("./utils/getUnixTime");
module.exports.getUptime = require("./utils/getUptime");
module.exports.getIsNodeJS = require("./utils/getIsNodeJS");
module.exports.deepMerge = require("./utils/deepMerge");
module.exports.getClassName = require("./utils/class-utils/getClassName");
module.exports.getClassInheritance = require("./utils/class-utils/getClassInheritance");
module.exports.getSuperClass = require("./utils/class-utils/getSuperClass");
// const symbolToUUID = require("./utils/symbolToUUID");

module.exports.eventConstantCheckingUtils = require("./utils/testing-utils/eventConstantCheckingUtils");

