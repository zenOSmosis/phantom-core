import PhantomCore, {
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
} from "./PhantomCore";
import phantomWatcherProviderSingleton, {
  EVT_PHANTOM_WATCHER_LOG_MISS,
  PhantomWatcherLogMissEventData,
} from "./PhantomCore/PhantomCoreOrchestrator";

export {
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
  EVT_PHANTOM_WATCHER_LOG_MISS,
};

/**
 * Provides a limited "birds-eye" view into the PhantomCore ecosystem.
 *
 * This also includes utility methods for setting log levels across groups of
 * PhantomCore instances, based on their class names.
 */
export default class PhantomWatcher extends PhantomCore {
  protected _phantomClassNames: string[] = [];

  constructor() {
    super();

    // Handle regular updates
    (() => {
      const _handleUpdate = () => {
        // Note: This type is coerced from a Set
        this._phantomClassNames = [
          ...phantomWatcherProviderSingleton.getPhantomClassNameSet(),
        ];

        // Propagate
        this.emit(EVT_UPDATE);
      };

      // Perform first sync
      _handleUpdate();

      // Note: Since phantomWatcherProviderSingleton is not a PhantomCore
      // instance itself, Phantom event proxies will not work here
      phantomWatcherProviderSingleton.on(EVT_UPDATE, _handleUpdate);
      this.registerCleanupHandler(() => {
        phantomWatcherProviderSingleton.off(EVT_UPDATE, _handleUpdate);
      });
    })();

    // Handle log miss proxying
    (() => {
      const _handleLogMiss = (data: PhantomWatcherLogMissEventData) => {
        this.emit(EVT_PHANTOM_WATCHER_LOG_MISS, data);
      };

      phantomWatcherProviderSingleton.on(
        EVT_PHANTOM_WATCHER_LOG_MISS,
        _handleLogMiss
      );

      this.registerCleanupHandler(() => {
        phantomWatcherProviderSingleton.off(
          EVT_PHANTOM_WATCHER_LOG_MISS,
          _handleLogMiss
        );
      });
    })();
  }

  /**
   * Gets the unique Phantom class names which are currently instantiated.
   */
  getPhantomClassNames(): string[] {
    return this._phantomClassNames;
  }

  // TODO: [3.0.0] Document
  getPhantomClassLogMisses(phantomClassName: string) {
    return phantomWatcherProviderSingleton.getPhantomClassLogMisses(
      phantomClassName
    );
  }

  /**
   * Retrieves the total number of PhantomCore instances which are currently
   * instantiated.
   */
  getTotalPhantomInstances(): number {
    return phantomWatcherProviderSingleton.getTotalPhantomInstances();
  }

  /**
   * Retrieves the total number of PhantomCore instances which share the given
   * class name.
   */
  getTotalPhantomInstancesWithClassName(phantomClassName: string): number {
    return phantomWatcherProviderSingleton.getTotalPhantomInstancesWithClassName(
      phantomClassName
    );
  }

  /**
   * Sets the global log level.
   */
  setGlobalLogLevel(logLevel: string | number): void {
    return phantomWatcherProviderSingleton.setGlobalLogLevel(logLevel);
  }

  /**
   * Retrieves the numeric global log level.
   */
  getGlobalLogLevel(): number {
    return phantomWatcherProviderSingleton.getGlobalLogLevel();
  }

  /**
   * Retrieves the initial numeric global log level.
   */
  getInitialGlobalLogLevel(): number {
    return phantomWatcherProviderSingleton.getInitialGlobalLogLevel();
  }

  /**
   * Determines if the log level has changed from the initial global value.
   */
  getHasGlobalLogLevelChanged(): boolean {
    return phantomWatcherProviderSingleton.getHasGlobalLogLevelChanged();
  }

  /**
   * Restores the global log level to its default value.
   */
  resetGlobalLogLevel(): void {
    return phantomWatcherProviderSingleton.resetGlobalLogLevel();
  }

  /**
   * Sets the log level of all current and future PhantomCore instances with
   * the given class name.
   */
  setPhantomClassLogLevel(
    phantomClassName: string,
    logLevel: string | number
  ): void {
    return phantomWatcherProviderSingleton.setPhantomClassLogLevel(
      phantomClassName,
      logLevel
    );
  }

  /**
   * Retrieves the numeric log level of the given Phantom class grouping.
   */
  getPhantomClassLogLevel(phantomClassName: string): number {
    return phantomWatcherProviderSingleton.getPhantomClassLogLevel(
      phantomClassName
    );
  }
}
