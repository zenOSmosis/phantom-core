import CommonEventEmitter from "../CommonEventEmitter";
import PhantomCore, { EVT_UPDATE } from "../PhantomCore/PhantomCore.base";
import Logger from "../Logger";

type PhantomClassName = string;

// TODO: [3.0.0] This should run as a singleton and never be destructed
// TODO: [3.0.0] Document
class _PhantomWatcherProvider extends CommonEventEmitter {
  protected _phantomInstances: Set<PhantomCore> = new Set();
  protected _phantomClassNameSet: Set<PhantomClassName> = new Set();

  protected _globalDefaultLogLevel: number = Logger.toNumericLogLevel("info");
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

    phantom.setLogLevel(this.getPhantomClassLogLevel(phantom.getClassName()));

    // Automatically removes duplicates
    this._phantomClassNameSet.add(phantom.getClassName());

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
    const numericLogLevel = Logger.toNumericLogLevel(logLevel);

    this._globalDefaultLogLevel = numericLogLevel;

    this.emit(EVT_UPDATE);
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
    return (
      this._phantomClassNameLogLevelMap.get(phantomClassName) ||
      this._globalDefaultLogLevel
    );
  }
}

export default new _PhantomWatcherProvider();
