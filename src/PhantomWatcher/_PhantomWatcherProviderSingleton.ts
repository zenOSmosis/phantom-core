import CommonEventEmitter from "../CommonEventEmitter";
import PhantomCore, { EVT_UPDATE } from "../PhantomCore/PhantomCore";
import Logger, { EVT_LOG_MISS } from "../Logger";
import globalLogger from "../globalLogger";

type PhantomClassName = string;

let _instance: _PhantomWatcherProvider;

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
  protected _phantomClassNameCountMap: Map<PhantomClassName, number> =
    new Map();
  protected _phantomClassNameLogLevelMap: Map<PhantomClassName, number> =
    new Map();

  // TODO: [3.0.0] Update type
  protected _phantomClassNameLogLevelMissMap: Map<PhantomClassName, number[]> =
    new Map();

  constructor() {
    if (_instance) {
      throw new Error(
        "Cannot instantiate _PhantomWatcherProvider more than once"
      );
    }

    super();

    _instance = this;
  }

  /**
   * Adds a PhantomCore instance to the watch list.
   */
  addInstance(phantom: PhantomCore): void {
    phantom.registerCleanupHandler(() => this._removeInstance(phantom));

    if (this._phantomInstances.has(phantom)) {
      throw new Error(
        "PhantomWatcherProvider already contains the given phantom instance"
      );
    }

    this._phantomInstances.add(phantom);

    const phantomClassName = phantom.getClassName();

    let perClassNameInstanceCount =
      this._phantomClassNameCountMap.get(phantomClassName) || 0;
    ++perClassNameInstanceCount;
    this._phantomClassNameCountMap.set(
      phantomClassName,
      perClassNameInstanceCount
    );

    if (!this._phantomClassNameLogLevelMissMap.has(phantomClassName)) {
      this._phantomClassNameLogLevelMissMap.set(
        phantomClassName,
        [0, 0, 0, 0, 0]
      );
    }

    phantom.on(EVT_LOG_MISS, (logLevel: number) => {
      // Update missMap counts
      const missMap =
        this._phantomClassNameLogLevelMissMap.get(phantomClassName);

      // TODO: [3.0.0] Use proper type
      ++(missMap as number[])[logLevel - 1];

      this._phantomClassNameLogLevelMissMap.set(
        phantomClassName,
        // TODO: [3.0.0] Use proper type
        missMap as number[]
      );

      this.emit(EVT_PHANTOM_WATCHER_LOG_MISS, {
        phantomClassName,
        title: phantom.getTitle(),
        logLevel,
      } as PhantomWatcherLogMissEventData);
    });

    // Set the log level to the group / global level
    phantom.setLogLevel(this.getPhantomClassLogLevel(phantomClassName));

    // Automatically removes duplicates
    this._phantomClassNameSet.add(phantomClassName);

    this.emit(EVT_UPDATE);
  }

  /**
   * Removes a PhantomCore instance from the watch list.
   */
  private _removeInstance(phantom: PhantomCore): void {
    this._phantomInstances.delete(phantom);
    const phantomClassName = phantom.getClassName();

    let perClassNameInstanceCount = this._phantomClassNameCountMap.get(
      phantomClassName
    ) as number;
    --perClassNameInstanceCount;
    this._phantomClassNameCountMap.set(
      phantomClassName,
      perClassNameInstanceCount
    );

    const instancesWithClassName = [...this._phantomInstances].filter(
      pred => pred.getClassName() === phantomClassName
    );

    // If no remaining instances with the given class name, delete it from the
    // set
    if (!instancesWithClassName.length) {
      this._phantomClassNameSet.delete(phantomClassName);
    }

    this.emit(EVT_UPDATE);
  }

  /**
   * Retrieves the Set of unique class names of registered PhantomCore
   * instances.
   */
  getPhantomClassNameSet(): Set<string> {
    return this._phantomClassNameSet;
  }

  // TODO: [3.0.0] Document type
  getPhantomClassLogMisses(phantomClassName: string) {
    return this._phantomClassNameLogLevelMissMap.get(phantomClassName);
  }

  /**
   * Retrieves the total number of PhantomCore instances which are currently
   * instantiated.
   */
  getTotalPhantomInstances(): number {
    return this._phantomInstances.size;
  }

  /**
   * Retrieves the total number of PhantomCore instances which share the given
   * class name.
   */
  getTotalPhantomInstancesWithClassName(phantomClassName: string): number {
    return this._phantomClassNameCountMap.get(phantomClassName) || 0;
  }

  /**
   * Sets the global log level.
   */
  setGlobalLogLevel(logLevel: string | number): void {
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

  /**
   * Retrieves the numeric global log level.
   */
  getGlobalLogLevel(): number {
    return globalLogger.getLogLevel();
  }

  /**
   * Retrieves the initial numeric global log level.
   */
  getInitialGlobalLogLevel(): number {
    return this._initialGlobalLogLevel;
  }

  /**
   * Determines if the log level has changed from the initial global value.
   */
  getHasGlobalLogLevelChanged(): boolean {
    return this.getGlobalLogLevel() !== this.getInitialGlobalLogLevel();
  }

  /**
   * Restores the global log level to its default value.
   */
  resetGlobalLogLevel(): void {
    return this.setGlobalLogLevel(this.getInitialGlobalLogLevel());
  }

  /**
   * Sets the log level of all current and future PhantomCore instances with
   * the given class name.
   */
  setPhantomClassLogLevel(
    phantomClassName: string,
    logLevel: string | number
  ): void {
    const numericLogLevel = Logger.toNumericLogLevel(logLevel);

    this._phantomClassNameLogLevelMap.set(phantomClassName, numericLogLevel);

    // Update relevant PhantomCore instances
    [...this._phantomInstances]
      .filter(pred => pred.getClassName() === phantomClassName)
      .forEach(pred => pred.setLogLevel(numericLogLevel));

    this.emit(EVT_UPDATE);
  }

  /**
   * Retrieves the numeric log level of the given Phantom class grouping.
   */
  getPhantomClassLogLevel(phantomClassName: string): number {
    const phantomClassLogLevel =
      this._phantomClassNameLogLevelMap.get(phantomClassName);

    if (phantomClassLogLevel !== undefined) {
      return phantomClassLogLevel;
    }

    return globalLogger.getLogLevel();
  }
}

export default new _PhantomWatcherProvider();
