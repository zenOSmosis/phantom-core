const PhantomCore = require("./PhantomCore");
const { EVT_READY, EVT_UPDATED, EVT_DESTROYED, EVT_NO_INIT_WARN } = PhantomCore;
const PhantomCollection = require("./PhantomCollection");
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
// const symbolToUUID = require("./utils/symbolToUUID");

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

module.exports.getUnixTime = getUnixTime;
module.exports.getUptime = getUptime;
// module.exports.symbolToUUID = symbolToUUID;
