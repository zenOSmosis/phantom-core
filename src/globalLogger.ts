// TODO: [3.0.0] Move handling into PhantomWatcher
import Logger from "./Logger";

/**
 * Utilizes a common logger instance as a singleton.
 *
 * Note: This is not attached to the global scope.
 */
export default new Logger();
