const PhantomCore = require("./PhantomCore");
const { EVT_READY, EVT_UPDATED, EVT_DESTROYED, EVT_NO_INIT_WARN } = PhantomCore;
const PhantomCollection = require("./PhantomCollection");
const PhantomServiceManager = require("./service-core-utils/PhantomServiceManager");
const PhantomServiceCore = require("./service-core-utils/PhantomServiceCore");
const PhantomState = require("./PhantomState");
const PhantomSerialState = require("./PhantomSerialState");
const Logger = require("./Logger");
const {
  LOG_LEVEL_TRACE,
  LOG_LEVEL_DEBUG,
  LOG_LEVEL_INFO,
  LOG_LEVEL_WARN,
  LOG_LEVEL_ERROR,
  LOG_LEVEL_SILENT,
} = Logger;

const getUnixTime = require("./utils/getUnixTime");
const getUptime = require("./utils/getUptime");
const getIsNodeJS = require("./utils/getIsNodeJS");
const deepMerge = require("./utils/deepMerge");
const getClassName = require("./utils/getClassName");
// const symbolToUUID = require("./utils/symbolToUUID");

const eventConstantCheckingUtils = require("./utils/testing-utils/eventConstantCheckingUtils");

module.exports = PhantomCore;
module.exports.PhantomCollection = PhantomCollection;
module.exports.EVT_READY = EVT_READY;
module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
module.exports.EVT_NO_INIT_WARN = EVT_NO_INIT_WARN;

module.exports.LOG_LEVEL_TRACE = LOG_LEVEL_TRACE;
module.exports.LOG_LEVEL_DEBUG = LOG_LEVEL_DEBUG;
module.exports.LOG_LEVEL_INFO = LOG_LEVEL_INFO;
module.exports.LOG_LEVEL_WARN = LOG_LEVEL_WARN;
module.exports.LOG_LEVEL_ERROR = LOG_LEVEL_ERROR;
module.exports.LOG_LEVEL_SILENT = LOG_LEVEL_SILENT;

// Independent logger (outside of PhantomCore instance; used instead of
// console.log)
module.exports.logger = new Logger();

module.exports.PhantomServiceManager = PhantomServiceManager;
module.exports.PhantomServiceCore = PhantomServiceCore;
module.exports.PhantomState = PhantomState;
module.exports.PhantomSerialState = PhantomSerialState;

module.exports.getUnixTime = getUnixTime;
module.exports.getUptime = getUptime;
module.exports.getIsNodeJS = getIsNodeJS;
module.exports.deepMerge = deepMerge;
module.exports.getClassName = getClassName;
// module.exports.symbolToUUID = symbolToUUID;

module.exports.eventConstantCheckingUtils = eventConstantCheckingUtils;
