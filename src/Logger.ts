export const LOG_LEVEL_TRACE = 0;
export const LOG_LEVEL_DEBUG = 1;
export const LOG_LEVEL_INFO = 2;
export const LOG_LEVEL_WARN = 3;
export const LOG_LEVEL_ERROR = 4;
export const LOG_LEVEL_SILENT = 5;

const LOG_LEVEL_STRING_MAP = {
  trace: LOG_LEVEL_TRACE,
  debug: LOG_LEVEL_DEBUG,
  info: LOG_LEVEL_INFO,
  warn: LOG_LEVEL_WARN,
  error: LOG_LEVEL_ERROR,
  silent: LOG_LEVEL_SILENT,
};

/**
 * A very simple JavaScript logger, which wraps console.log/debug, etc. calls
 * while retaining the original stack traces.
 *
 * This utility was inspired by https://www.npmjs.com/package/loglevel. One of
 * the main reasons why I didn't use loglevel is because loglevel doesn't use
 * the browser's default console.debug mechanism and setting up namespaced
 * loggers wasn't very straightforward.
 */
export default class Logger {
  public log: () => null | { [key: string]: () => null };

  // TODO: [3.0.0] Fix any type
  protected _options: any;

  protected _logLevel: number;

  constructor(options = {}) {
    const DEFAULT_OPTIONS = {
      logLevel: LOG_LEVEL_INFO,
      // TODO: [3.0.0] Fix any type
      prefix: (logLevel: any) => `[${logLevel}]`,
    };

    this._options = { ...DEFAULT_OPTIONS, ...options };

    this.log = null;
    this._logLevel = this._options.logLevel;

    // Set up log level, extending this class functionality with log levels
    this.setLogLevel(this._options.logLevel);
  }

  /**
   * Sets minimum log level to send to actual logger function where subsequent
   * log levels are ignored.
   */
  setLogLevel(logLevel: number) {
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

      const loggerMethods: { [key: string]: () => null } = {};

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
          prefix("warn")
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

      // Calling this.log() directly will log as info (log info alias)
      const log: () => null | { [key: string]: () => null } =
        loggerMethods.info;

      // Dynamically assign log methods to log
      Object.keys(loggerMethods).forEach(method => {
        // IMPORTANT: Both of these are used intentionally

        // Extend off of log method (i.e. PhantomCore's this.log.debug)
        // TODO: [3.0.0] Fix any type
        (log as any)[method] = loggerMethods[method];

        // Extend class with logger methods
        // TODO: [3.0.0] Fix any type
        (this as any)[method] = loggerMethods[method];
      });

      return log;
    })();
  }

  /**
   * @return {LOG_LEVEL_TRACE | LOG_LEVEL_DEBUG | LOG_LEVEL_INFO | LOG_LEVEL_WARN | LOG_LEVEL_ERROR | LOG_LEVEL_SILENT}
   */
  getLogLevel() {
    return this._logLevel;
  }
}
