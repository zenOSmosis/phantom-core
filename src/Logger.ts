import _DestructibleEventEmitter, {
  EVT_DESTROY,
} from "./_DestructibleEventEmitter";
import { ClassInstance } from "./utils/class-utils/types";

export enum LogLevel {
  Silent = 0,
  Error = 1,
  Warn = 2,
  Info = 3,
  Debug = 4,
  Trace = 5,
}

export { EVT_DESTROY };

// TODO: [3.0.0] Use Map here?
const LOG_LEVEL_STRING_MAP: { [key: string]: number } = {
  silent: LogLevel.Silent,
  error: LogLevel.Error,
  warn: LogLevel.Warn,
  info: LogLevel.Info,
  debug: LogLevel.Debug,
  trace: LogLevel.Trace,
};

export type LogIntersection = Logger & ((...args: any[]) => void);

/**
 * @event EVT_LOG_MISS Emits with relevant LogLevel if the log is ignored.
 */
export const EVT_LOG_MISS = "log-miss";

/**
 * A very simple JavaScript logger, which wraps console.log/debug, etc. calls
 * while retaining the original stack traces.
 *
 * This utility was inspired by https://www.npmjs.com/package/loglevel. One of
 * the main reasons why I didn't use loglevel is because loglevel doesn't use
 * the browser's default console.debug mechanism and setting up namespaced
 * loggers wasn't very straightforward.
 */
export default class Logger extends _DestructibleEventEmitter {
  public log: LogIntersection;

  protected _options: {
    logLevel: number;
    prefix: (strLogLevel: string) => string;
  };

  protected _logLevel: number = LogLevel.Info;
  protected _prefix: (strLogLevel: string) => string;

  /**
   * Converts the given log level to a number.
   *
   * @throws {RangeError} Throws if the log level is not an expected value.
   */
  static toNumericLogLevel(logLevel: string | number): number {
    let numericLogLevel: number;

    if (typeof logLevel === "string") {
      // Ignore the next line because we don't yet know if logLevel is incorrect
      // @ts-ignore
      numericLogLevel = LOG_LEVEL_STRING_MAP[logLevel];
    } else {
      numericLogLevel = logLevel;
    }

    // Ignore the next line because we don't yet know if logLevel is incorrect
    // @ts-ignore
    if (!Object.values(LOG_LEVEL_STRING_MAP).includes(numericLogLevel)) {
      throw new RangeError(`Unknown log level: ${logLevel}`);
    }

    return numericLogLevel;
  }

  /**
   * Converts the given log level to a string.
   *
   * @throws {RangeError} Throws if the log level is not an expected value.
   */
  static toStringLogLevel(logLevel: string | number): string {
    let strLogLevel: string = "";

    if (typeof logLevel === "string") {
      strLogLevel = logLevel as string;
    } else {
      const entry = Object.entries(LOG_LEVEL_STRING_MAP).find(
        ([key, value]) => value === logLevel
      );

      if (entry) {
        strLogLevel = entry[0];
      }
    }

    if (
      !strLogLevel ||
      typeof LOG_LEVEL_STRING_MAP[strLogLevel] === "undefined"
    ) {
      throw new RangeError(`Unknown log level: ${logLevel}`);
    }

    return strLogLevel;
  }

  constructor(options = {}) {
    super();

    const DEFAULT_OPTIONS = {
      logLevel: LogLevel.Info,
      prefix: (strLogLevel: string) => `[${strLogLevel}]`,
    };

    this._options = { ...DEFAULT_OPTIONS, ...options };
    this.log = null as unknown as LogIntersection;
    this._prefix = this._options.prefix;

    // Set up log level, extending this class functionality with log levels
    this.setLogLevel(this._options.logLevel);
  }

  /**
   * Provides the ability to override the logging prefix with a custom string
   * handler.
   */
  setPrefix(prefix: (strLogLevel: string) => string): void {
    this._prefix = prefix;
  }

  /**
   * Sets minimum log level to send to actual logger function where subsequent
   * log levels are ignored.
   */
  setLogLevel(logLevel: number | string): void {
    this._logLevel = Logger.toNumericLogLevel(logLevel);

    // Dynamically create log function, filtering out methods which are outside
    // of logLevel scope
    this.log = (() => {
      const prefix = this._prefix;

      /**
       * Each logger method should retain original stack trace
       *
       * @see https://stackoverflow.com/questions/9559725/extending-console-log-without-affecting-log-line
       */

      const loggerMethods: { [key: string]: () => void } = {};

      if (this._logLevel >= LogLevel.Error) {
        loggerMethods.error = Function.prototype.bind.call(
          console.error,
          console,
          prefix("error")
        );
      } else {
        loggerMethods.error = () => this.emit(EVT_LOG_MISS, LogLevel.Error);
      }

      if (this._logLevel >= LogLevel.Warn) {
        loggerMethods.warn = Function.prototype.bind.call(
          console.warn,
          console,
          prefix("warn")
        );
      } else {
        loggerMethods.warn = () => this.emit(EVT_LOG_MISS, LogLevel.Warn);
      }

      if (this._logLevel >= LogLevel.Info) {
        loggerMethods.info = Function.prototype.bind.call(
          console.info,
          console,
          prefix("info")
        );
      } else {
        loggerMethods.info = () => this.emit(EVT_LOG_MISS, LogLevel.Info);
      }

      if (this._logLevel >= LogLevel.Debug) {
        loggerMethods.debug = Function.prototype.bind.call(
          console.debug,
          console,
          prefix("debug")
        );
      } else {
        loggerMethods.debug = () => this.emit(EVT_LOG_MISS, LogLevel.Debug);
      }

      if (this._logLevel >= LogLevel.Trace) {
        loggerMethods.trace = Function.prototype.bind.call(
          console.trace,
          console,
          prefix("trace")
        );
      } else {
        loggerMethods.trace = () => this.emit(EVT_LOG_MISS, LogLevel.Trace);
      }

      // Calling this.log() directly will log as info (log info alias)
      const log: ClassInstance = loggerMethods.info;

      // Dynamically assign log methods to log
      // TODO: [3.0.0] Rewrite to handlers which are exposed via class methods
      Object.keys(loggerMethods).forEach(method => {
        // IMPORTANT: Both of these are used intentionally

        // Extend off of log method (i.e. PhantomCore's this.log.debug)
        log[method] = loggerMethods[method];

        // Extend class with logger methods
        (this as ClassInstance)[method] = loggerMethods[method];
      });

      return log;
    })() as unknown as LogIntersection;
  }

  getLogLevel(): number {
    return this._logLevel;
  }

  /**
   * Outputs a stack trace to the console.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/console/trace
   */
  trace(...args: any[]): void {
    throw new Error("This should be overridden");
  }

  /**
   * Outputs a message to the console at the "debug" log level.
   *
   * This message is only displayed to the user if the console is configured to
   * display debug output.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/console/debug
   */
  debug(...args: any[]): void {
    throw new Error("This should be overridden");
  }

  /**
   * Outputs an informational message to the console.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/console/info
   */
  info(...args: any[]): void {
    throw new Error("This should be overridden");
  }

  /**
   * Outputs a warning message to the console.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/console/warn
   */
  warn(...args: any[]): void {
    throw new Error("This should be overridden");
  }

  /**
   * Outputs an error message to the console.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/console/error
   */
  error(...args: any[]): void {
    throw new Error("This should be overridden");
  }
}
