import PhantomCore, {
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
} from "./PhantomCore";
import phantomCoreOrchestrator, {
  EVT_PHANTOM_WATCHER_LOG_MISS,
  PhantomWatcherLogMissEventData,
  LogMissCounts,
  LogMissCountIndex,
} from "./PhantomCore/_PhantomCoreOrchestrator";

export {
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
  EVT_PHANTOM_WATCHER_LOG_MISS,
};

export type { LogMissCounts, LogMissCountIndex };

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

    // Handle orchestrator update events
    (() => {
      const _handleUpdate = () => {
        // Note: This type is coerced from a Set and is cached so that it
        // doesn't have to be iterated each time it is requested
        this._phantomClassNames = [
          ...phantomCoreOrchestrator.getPhantomClassNameSet(),
        ];

        // Propagate
        this.emit(EVT_UPDATE);
      };

      // Perform first sync
      _handleUpdate();

      // Note: Since phantomCoreOrchestrator is not a PhantomCore
      // instance itself, Phantom event proxies will not work here
      phantomCoreOrchestrator.on(EVT_UPDATE, _handleUpdate);
      this.registerCleanupHandler(() => {
        phantomCoreOrchestrator.off(EVT_UPDATE, _handleUpdate);
      });
    })();

    // Handle log miss proxying
    (() => {
      const _handleLogMiss = (data: PhantomWatcherLogMissEventData) => {
        this.emit(EVT_PHANTOM_WATCHER_LOG_MISS, data);
      };

      // Note that since PhantomCoreOrchestrator is not a PhantomCore instance
      // itself, the event proxy functions are not immediately available to it
      phantomCoreOrchestrator.on(EVT_PHANTOM_WATCHER_LOG_MISS, _handleLogMiss);
      this.registerCleanupHandler(() => {
        phantomCoreOrchestrator.off(
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

  getPhantomClassLogMissCounts(phantomClassName: string): LogMissCounts {
    return phantomCoreOrchestrator.getPhantomClassLogMissCounts(
      phantomClassName
    );
  }

  /**
   * Retrieves the total number of PhantomCore instances which are currently
   * instantiated.
   */
  getTotalPhantomInstances(): number {
    return phantomCoreOrchestrator.getTotalPhantomInstances();
  }

  /**
   * Retrieves the total number of PhantomCore instances which share the given
   * class name.
   */
  getTotalPhantomInstancesWithClassName(phantomClassName: string): number {
    return phantomCoreOrchestrator.getTotalPhantomInstancesWithClassName(
      phantomClassName
    );
  }

  /**
   * Sets the global log level.
   */
  setGlobalLogLevel(logLevel: string | number): void {
    return phantomCoreOrchestrator.setGlobalLogLevel(logLevel);
  }

  /**
   * Retrieves the numeric global log level.
   */
  getGlobalLogLevel(): number {
    return phantomCoreOrchestrator.getGlobalLogLevel();
  }

  /**
   * Retrieves the initial numeric global log level.
   */
  getInitialGlobalLogLevel(): number {
    return phantomCoreOrchestrator.getInitialGlobalLogLevel();
  }

  /**
   * Determines if the log level has changed from the initial global value.
   */
  getHasGlobalLogLevelChanged(): boolean {
    return phantomCoreOrchestrator.getHasGlobalLogLevelChanged();
  }

  /**
   * Restores the global log level to its default value.
   */
  resetGlobalLogLevel(): void {
    return phantomCoreOrchestrator.resetGlobalLogLevel();
  }

  /**
   * Sets the log level of all current and future PhantomCore instances with
   * the given class name.
   */
  setPhantomClassLogLevel(
    phantomClassName: string,
    logLevel: string | number
  ): void {
    return phantomCoreOrchestrator.setPhantomClassLogLevel(
      phantomClassName,
      logLevel
    );
  }

  /**
   * Retrieves the numeric log level of the given Phantom class grouping.
   */
  getPhantomClassLogLevel(phantomClassName: string): number {
    return phantomCoreOrchestrator.getPhantomClassLogLevel(phantomClassName);
  }
}
