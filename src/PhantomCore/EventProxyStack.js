const PhantomCore = require(".");
const _DestructibleEventEmitter = require("../_DestructibleEventEmitter");
const { EVT_DESTROYED } = _DestructibleEventEmitter;

module.exports = class EventProxyStack extends _DestructibleEventEmitter {
  /**
   * Provides event proxy management for PhantomCore's, proxyOn, proxyOnce, and
   * proxyOff methods.
   *
   * Internally it binds the events to the remote target instance(s) and manages
   * their handling.
   *
   * NOTE: A single EVT_DESTROYED method is also attached to every target
   * instance to perform shutdown handling.
   */
  constructor() {
    super();

    /**
     * Associated event proxy handlers attached to target instances.
     *
     * @type {[targetInstance: PhantomCore, eventName: string, eventHandler: Function]}
     */
    this._eventProxyBinds = [];

    /**
     * Associated EVT_DESTROYED handlers attached to target instances, which
     * are invoked if the target instance is destructed before the local
     * instance.
     *
     * @type {Map<{key: PhantomCore, value: Function}>}
     */
    this._targetDestroyHandlers = new Map();
  }

  /**
   * Adds the given proxy handler to the given target instance.
   *
   * @param {"on" | "once"} onOrOnce
   * @param {PhantomCore} targetInstance
   * @param {string} eventName
   * @param {Function} eventHandler
   * @return {void}
   */
  addProxyHandler(onOrOnce, targetInstance, eventName, eventHandler) {
    if (onOrOnce !== "on" && onOrOnce !== "once") {
      throw new ReferenceError(`Unhandled value "${onOrOnce}" for onOrOnce`);
    }

    this._eventProxyBinds.push([targetInstance, eventName, eventHandler]);

    // Bind the event handler to the target instance
    targetInstance[onOrOnce](eventName, eventHandler);

    // Automatically unregister if the target instance is destructed before
    // this instance
    //
    // If there is not a target destroy handler...
    if (!this._targetDestroyHandlers.get(targetInstance)) {
      // ... create one
      this._targetDestroyHandlers.set(targetInstance, () => {
        this._eventProxyBinds
          // IMPORTANT: Only invoke proxyOff for bound eventHandlers for the
          // correct target instance
          .filter(
            ([predTargetInstance]) => predTargetInstance === targetInstance
          )
          .forEach(args => this.removeProxyHandler(...args));
      });

      // ... then register the target destroy handler to run once the target
      // emits EVT_DESTROYED
      targetInstance.once(
        EVT_DESTROYED,
        this._targetDestroyHandlers.get(targetInstance)
      );
    }
  }

  /**
   * Removes the given proxy handler from the given target instance.
   *
   * @param {PhantomCore} targetInstance
   * @param {string} eventName
   * @param {Function} eventHandler
   * @return {void}
   */
  removeProxyHandler(targetInstance, eventName, eventHandler) {
    let hasRemoved = false;

    this._eventProxyBinds = this._eventProxyBinds.filter(
      ([predTargetInstance, predEventName, predEventHandler]) => {
        // If an associated event handler is added more than once, for the
        // given event name, only remove it once from the _eventProxyBinds.
        // This target instance's event emitter manages how it wishes to keep
        // track of duplicated event handlers across on / once. Our job here is
        // to not try to manage that here, but just keep track of the
        // associated proxies, one-by-one, so we can ensure we fully unregister
        // them when we shut down.
        if (hasRemoved) {
          return true;
        } else {
          let willKeep = true;

          if (predTargetInstance !== targetInstance) {
            willKeep = true;
          } else if (predEventName !== eventName) {
            willKeep = true;
          } else if (predEventHandler !== eventHandler) {
            willKeep = true;
          } else {
            willKeep = false;
          }

          if (!willKeep) {
            hasRemoved = true;
          }

          return willKeep;
        }
      }
    );

    // Unbind the event handler from the target instance
    targetInstance.off(eventName, eventHandler);
  }

  /**
   * Removes all proxy handlers for all of the target instances.
   *
   * @return {void}
   */
  _removeAllProxyHandlers() {
    this._eventProxyBinds.forEach(([targetInstance, eventName, eventHandler]) =>
      this.removeProxyHandler(targetInstance, eventName, eventHandler)
    );
  }

  /**
   * Unregisters all remote destroy handlers for the target instances.
   *
   * @return {void}
   */
  _removeAllTargetDestroyHandlers() {
    for (const [targetInstance, destroyHandler] of this
      ._targetDestroyHandlers) {
      targetInstance.off(EVT_DESTROYED, destroyHandler);

      this._targetDestroyHandlers.delete(targetInstance);
    }
  }

  /**
   * Retrieves the number of proxied events to the given target instance.
   *
   * @param {PhantomCore} targetInstance
   * @return {number}
   */
  getTargetInstanceQueueDepth(targetInstance) {
    return this._eventProxyBinds.reduce((acc, curr) => {
      const predTargetInstance = curr[0];
      if (targetInstance === predTargetInstance) {
        return acc + 1;
      } else {
        return acc;
      }
    }, 0);
  }

  /**
   * @return {Promise<void>}
   */
  async destroy() {
    return super.destroy(() => {
      this._removeAllProxyHandlers();

      // Shutdown checking
      if (this._eventProxyBinds.length > 0) {
        throw new Error("Did not successfully unregister event proxy binds");
      }

      this._removeAllTargetDestroyHandlers();

      // Shutdown checking
      if ([...this._targetDestroyHandlers].length > 0) {
        throw new Error(
          "Did not successfully unregister target destroy handlers"
        );
      }
    });
  }
};
