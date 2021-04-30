const LOG_LEVEL_TRACE = 0;
const LOG_LEVEL_DEBUG = 1;
const LOG_LEVEL_INFO = 2;
const LOG_LEVEL_WARN = 3;
const LOG_LEVEL_ERROR = 4;
const LOG_LEVEL_SILENT = 5;

const LOG_LEVEL_STRING_MAP = {
  trace: LOG_LEVEL_TRACE,
  debug: LOG_LEVEL_DEBUG,
  info: LOG_LEVEL_INFO,
  warn: LOG_LEVEL_WARN,
  error: LOG_LEVEL_ERROR,
  silent: LOG_LEVEL_SILENT,
};

class Logger {
  constructor(options = {}) {
    const DEFAULT_OPTIONS = {
      logLevel: LOG_LEVEL_INFO,
      prefix: logLevel => `[${logLevel}]`,
    };

    this._options = { ...DEFAULT_OPTIONS, ...options };

    this.log = null;
    this._logLevel = this._options.logLevel;

    this.setLogLevel(this._options.logLevel);
  }

  setLogLevel(logLevel) {
    if (typeof logLevel === "string") {
      logLevel = LOG_LEVEL_STRING_MAP[logLevel];
    }

    if (!Object.values(LOG_LEVEL_STRING_MAP).includes(logLevel)) {
      throw new Error(`Unknown log level: ${logLevel}`);
    }

    this._logLevel = logLevel;

    // Dynamically create log function, filtering out methods which are outside
    // of logLevel scope
    this.log = (() => {
      const prefix = this._options.prefix;

      /**
       * Each logger method should retain original stack trace
       *
       * @see https://stackoverflow.com/questions/9559725/extending-console-log-without-affecting-log-line
       */

      const loggerMethods = {};

      if (logLevel <= LOG_LEVEL_TRACE) {
        loggerMethods.trace = Function.prototype.bind.call(
          console.trace,
          console,
          prefix("trace")
        );
      } else {
        loggerMethods.trace = () => null;
      }

      if (logLevel <= LOG_LEVEL_DEBUG) {
        loggerMethods.debug = Function.prototype.bind.call(
          console.debug,
          console,
          prefix("debug")
        );
      } else {
        loggerMethods.debug = () => null;
      }

      if (logLevel <= LOG_LEVEL_INFO) {
        loggerMethods.info = Function.prototype.bind.call(
          console.info,
          console,
          prefix("info")
        );
      } else {
        loggerMethods.info = () => null;
      }

      if (logLevel <= LOG_LEVEL_WARN) {
        loggerMethods.warn = Function.prototype.bind.call(
          console.warn,
          console,
          prefix("warm")
        );
      } else {
        loggerMethods.warn = () => null;
      }

      if (logLevel <= LOG_LEVEL_ERROR) {
        loggerMethods.error = Function.prototype.bind.call(
          console.error,
          console,
          prefix("error")
        );
      } else {
        loggerMethods.error = () => null;
      }

      // Calling this.log() directly will log as info
      const log = {};

      Object.keys(loggerMethods).forEach(method => {
        log[method] = loggerMethods[method];
      });

      return log;
    })();
  }

  getLogLevel() {
    return this._logLevel;
  }
}

module.exports = Logger;
module.exports.LOG_LEVEL_TRACE = LOG_LEVEL_TRACE;
module.exports.LOG_LEVEL_DEBUG = LOG_LEVEL_DEBUG;
module.exports.LOG_LEVEL_INFO = LOG_LEVEL_INFO;
module.exports.LOG_LEVEL_WARN = LOG_LEVEL_WARN;
module.exports.LOG_LEVEL_ERROR = LOG_LEVEL_ERROR;
module.exports.LOG_LEVEL_SILENT = LOG_LEVEL_SILENT;
