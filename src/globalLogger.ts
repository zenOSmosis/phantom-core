import Logger from "./Logger";

/**
 * Utilizes a common logger instance as a singleton.
 *
 * Note: this is not directly attached to the global scope.
 */
const globalLogger = new Logger();

export default globalLogger;
