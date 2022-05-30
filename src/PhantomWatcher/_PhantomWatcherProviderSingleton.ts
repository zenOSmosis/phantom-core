import CommonEventEmitter from "../CommonEventEmitter";
import PhantomCore, { EVT_UPDATE } from "../PhantomCore/PhantomCore.base";
import Logger, { EVT_LOG_MISS } from "../Logger";
import globalLogger from "../globalLogger";

type PhantomClassName = string;

// TODO: [3.0.0] Document
export const EVT_PHANTOM_WATCHER_LOG_MISS = "phantom-group-watcher-log-miss";
export type PhantomWatcherLogMissEventData = {
  phantomClassName: PhantomClassName;
  title: string | null;
  logLevel: number;
};

// TODO: [3.0.0] This should run as a singleton and never be destructed
// TODO: [3.0.0] Document
class _PhantomWatcherProvider extends CommonEventEmitter {
  protected _initialGlobalLogLevel: number = globalLogger.getLogLevel();

  protected _phantomInstances: Set<PhantomCore> = new Set();
  protected _phantomClassNameSet: Set<PhantomClassName> = new Set();
  protected _phantomClassNameLogLevelMap: Map<PhantomClassName, number> =
    new Map();

  // TODO: [3.0.0] Document
  addInstance(phantom: PhantomCore) {
    phantom.registerCleanupHandler(() => this._removeInstance(phantom));

    if (this._phantomInstances.has(phantom)) {
      throw new Error(
        "PhantomWatcherProvider already contains the given phantom instance"
      );
    }

    this._phantomInstances.add(phantom);

    const phantomClassName = phantom.getClassName();

    phantom.setLogLevel(this.getPhantomClassLogLevel(phantomClassName));

    phantom.on(EVT_LOG_MISS, (logLevel: number) => {
      this.emit(EVT_PHANTOM_WATCHER_LOG_MISS, {
        phantomClassName,
        title: phantom.getTitle(),
        logLevel,
      } as PhantomWatcherLogMissEventData);
    });

    // Automatically removes duplicates
    this._phantomClassNameSet.add(phantomClassName);

    this.emit(EVT_UPDATE);
  }

  /**
   * Retrieves the Set of unique class names of registered PhantomCore
   * instances.
   */
  getPhantomClassNameSet() {
    return this._phantomClassNameSet;
  }

  // TODO: [3.0.0] Document
  getTotalPhantomInstances() {
    return this._phantomInstances.size;
  }

  // TODO: [3.0.0] Document
  protected _removeInstance(phantom: PhantomCore) {
    this._phantomInstances.delete(phantom);
    const className = phantom.getClassName();

    const instancesWithClassName = [...this._phantomInstances].filter(
      pred => pred.getClassName() === className
    );

    // If no remaining instances with the given class name, delete it from the
    // set
    if (!instancesWithClassName.length) {
      this._phantomClassNameSet.delete(className);
    }

    this.emit(EVT_UPDATE);
  }

  // TODO: [3.0.0] Document
  setGlobalLogLevel(logLevel: string | number) {
    globalLogger.setLogLevel(logLevel);

    const phantomClassNamesWithLogLevels = [
      ...this._phantomClassNameLogLevelMap.keys(),
    ];

    // Update PhantomCore instances which have not already been modified
    [...this._phantomInstances]
      .filter(
        pred => !phantomClassNamesWithLogLevels.includes(pred.getClassName())
      )
      .forEach(pred => pred.setLogLevel(logLevel));

    this.emit(EVT_UPDATE);
  }

  // TODO: [3.0.0] Document
  getGlobalLogLevel() {
    return globalLogger.getLogLevel();
  }

  // TODO: [3.0.0] Document
  getInitialGlobalLogLevel() {
    return this._initialGlobalLogLevel;
  }

  // TODO: [3.0.0] Document
  getHasGlobalLogLevelChanged() {
    return this.getGlobalLogLevel() !== this.getInitialGlobalLogLevel();
  }

  // TODO: [3.0.0] Document
  resetGlobalLogLevel() {
    return this.setGlobalLogLevel(this.getInitialGlobalLogLevel());
  }

  // TODO: [3.0.0] Document
  setPhantomClassLogLevel(phantomClassName: string, logLevel: string | number) {
    const numericLogLevel = Logger.toNumericLogLevel(logLevel);

    this._phantomClassNameLogLevelMap.set(phantomClassName, numericLogLevel);

    // Update relevant PhantomCore instances
    [...this._phantomInstances]
      .filter(pred => pred.getClassName() === phantomClassName)
      .forEach(pred => pred.setLogLevel(numericLogLevel));

    this.emit(EVT_UPDATE);
  }

  // TODO: [3.0.0] Document
  getPhantomClassLogLevel(phantomClassName: string) {
    const phantomClassLogLevel =
      this._phantomClassNameLogLevelMap.get(phantomClassName);

    if (phantomClassLogLevel !== undefined) {
      return phantomClassLogLevel;
    }

    return globalLogger.getLogLevel();
  }
}

export default new _PhantomWatcherProvider();
