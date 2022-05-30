import PhantomCore, {
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
} from "../PhantomCore";
import phantomWatcherProviderSingleton, {
  EVT_PHANTOM_WATCHER_LOG_MISS,
  PhantomWatcherLogMissEventData,
} from "./_PhantomWatcherProviderSingleton";

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

  getPhantomClassNames() {
    return this._phantomClassNames;
  }

  // TODO: [3.0.0] Document
  getPhantomClassLogMisses(phantomClassName: string) {
    return phantomWatcherProviderSingleton.getPhantomClassLogMisses(
      phantomClassName
    );
  }

  // TODO: [3.0.0] Document
  getTotalPhantomInstances() {
    return phantomWatcherProviderSingleton.getTotalPhantomInstances();
  }

  // TODO: [3.0.0] Document
  getTotalPhantomInstancesWithClassName(phantomClassName: string) {
    return phantomWatcherProviderSingleton.getTotalPhantomInstancesWithClassName(
      phantomClassName
    );
  }

  // TODO: [3.0.0] Document
  setGlobalLogLevel(logLevel: string | number) {
    return phantomWatcherProviderSingleton.setGlobalLogLevel(logLevel);
  }

  // TODO: [3.0.0] Document
  getGlobalLogLevel() {
    return phantomWatcherProviderSingleton.getGlobalLogLevel();
  }

  // TODO: [3.0.0] Document
  getInitialGlobalLogLevel() {
    return phantomWatcherProviderSingleton.getInitialGlobalLogLevel();
  }

  // TODO: [3.0.0] Document
  getHasGlobalLogLevelChanged() {
    return phantomWatcherProviderSingleton.getHasGlobalLogLevelChanged();
  }

  // TODO: [3.0.0] Document
  resetGlobalLogLevel() {
    return phantomWatcherProviderSingleton.resetGlobalLogLevel();
  }

  // TODO: [3.0.0] Document
  setPhantomClassLogLevel(phantomClassName: string, logLevel: string | number) {
    return phantomWatcherProviderSingleton.setPhantomClassLogLevel(
      phantomClassName,
      logLevel
    );
  }

  // TODO: [3.0.0] Document
  getPhantomClassLogLevel(phantomClassName: string) {
    return phantomWatcherProviderSingleton.getPhantomClassLogLevel(
      phantomClassName
    );
  }
}
