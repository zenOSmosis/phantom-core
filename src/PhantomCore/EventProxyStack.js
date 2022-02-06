const _DestructibleEventEmitter = require("../_DestructibleEventEmitter");
const { EVT_DESTROYED } = _DestructibleEventEmitter;

// TODO: Document
module.exports = class EventProxyStack extends _DestructibleEventEmitter {
  constructor() {
    super();

    // TODO: Document structure
    this._eventProxyBinds = [];

    // TODO: Document structure
    this._targetDestroyHandlers = new Map();
  }

  // TODO: Document
  addProxyHandler(onOrOnce, targetInstance, eventName, eventHandler) {
    this._eventProxyBinds.push([targetInstance, eventName, eventHandler]);

    // Bind the event handler to the target instance
    targetInstance[onOrOnce](eventName, eventHandler);

    // Handle scenario where targetInstance is destructed before local instance
    if (!this._targetDestroyHandlers.get(targetInstance)) {
      this._targetDestroyHandlers.set(targetInstance, () => {
        // Invoke proxyOff for bound eventHandlers
        this._eventProxyBinds
          .filter(
            ([predTargetInstance]) => predTargetInstance === targetInstance
          )
          .forEach(args => this.removeProxyHandler(...args));
      });

      targetInstance.once(
        EVT_DESTROYED,
        this._targetDestroyHandlers.get(targetInstance)
      );
    }
  }

  // TODO: Document
  removeProxyHandler(targetInstance, eventName, eventHandler) {
    let hasRemoved = false;

    this._eventProxyBinds = this._eventProxyBinds.filter(
      ([predTargetInstance, predEventName, predEventHandler]) => {
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

  // TODO: Document
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
      this._eventProxyBinds.forEach(
        ([targetInstance, eventName, eventHandler]) =>
          this.removeProxyHandler(targetInstance, eventName, eventHandler)
      );

      if (this._eventProxyBinds.length > 0) {
        throw new Error("Did not successfully unregister event proxy binds");
      }

      for (const [targetInstance, destroyHandler] of this
        ._targetDestroyHandlers) {
        targetInstance.off(EVT_DESTROYED, destroyHandler);

        this._targetDestroyHandlers.delete(targetInstance);
      }

      if ([...this._targetDestroyHandlers].length > 0) {
        throw new Error(
          "Did not successfully unregister target destroy handlers"
        );
      }
    });
  }
};
