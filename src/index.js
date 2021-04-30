const PhantomBase = require("./PhantomBase");
const {
  EVT_READY,
  EVT_UPDATED,
  EVT_DESTROYED,
  EVT_NO_INIT_WARN,
  LOG_LEVEL_TRACE,
  LOG_LEVEL_DEBUG,
  LOG_LEVEL_INFO,
  LOG_LEVEL_WARN,
  LOG_LEVEL_ERROR,
} = PhantomBase;

module.exports = PhantomBase;
module.exports.EVT_READY = EVT_READY;
module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
module.exports.EVT_NO_INIT_WARN = EVT_NO_INIT_WARN;

module.exports.LOG_LEVEL_TRACE = LOG_LEVEL_TRACE;
module.exports.LOG_LEVEL_DEBUG = LOG_LEVEL_DEBUG;
module.exports.LOG_LEVEL_INFO = LOG_LEVEL_INFO;
module.exports.LOG_LEVEL_WARN = LOG_LEVEL_WARN;
module.exports.LOG_LEVEL_ERROR = LOG_LEVEL_ERROR;
