import assert from "assert";
import PhantomCore from ".";
import _DestructibleEventEmitter, {
  EVT_DESTROYED,
} from "../_DestructibleEventEmitter";

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
export default class EventProxyStack extends _DestructibleEventEmitter {
  protected _eventProxyBinds: {
    targetInstance: PhantomCore;
    eventName: string | symbol;
    eventHandler: (...args: any[]) => void;
  }[];
  protected _targetDestroyHandlers: Map<PhantomCore, (...args: any[]) => void>;

  constructor() {
    super();

    /**
     * Associated event proxy handlers attached to target instances.
     */
    this._eventProxyBinds = [];

    /**
     * Associated EVT_DESTROYED handlers attached to target instances, which
     * are invoked if the target instance is destructed before the local
     * instance.
     */
    this._targetDestroyHandlers = new Map();
  }

  /**
   * Adds the given proxy handler to the given target instance.
   */
  addProxyHandler(
    onOrOnce: "on" | "once",
    targetInstance: PhantomCore,
    eventName: string | symbol,
    eventHandler: (...args: any[]) => void
  ) {
    if (onOrOnce !== "on" && onOrOnce !== "once") {
      throw new ReferenceError(`Unhandled value "${onOrOnce}" for onOrOnce`);
    }

    this._eventProxyBinds.push({ targetInstance, eventName, eventHandler });

    // Bind the event handler to the target instance
    targetInstance[onOrOnce](eventName, eventHandler);

    // Automatically unregister if the target instance is destructed before
    // this instance
    //
    // If there is not a target destroy handler...
    if (!this._targetDestroyHandlers.get(targetInstance)) {
      const instanceDestroyHandler = () => {
        this._eventProxyBinds
          // IMPORTANT: Only invoke proxyOff for bound eventHandlers for the
          // correct target instance
          .filter(
            ({ targetInstance: predTargetInstance }) =>
              predTargetInstance === targetInstance
          )
          .forEach(({ targetInstance, eventName, eventHandler }) =>
            this.removeProxyHandler(targetInstance, eventName, eventHandler)
          );
      };

      // ... create one
      this._targetDestroyHandlers.set(targetInstance, instanceDestroyHandler);

      // ... then register the target destroy handler to run once the target
      // emits EVT_DESTROYED
      targetInstance.once(EVT_DESTROYED, instanceDestroyHandler);
    }
  }

  /**
   * Removes the given proxy handler from the given target instance.
   */
  removeProxyHandler(
    targetInstance: PhantomCore,
    eventName: string | symbol,
    eventHandler: (...args: any[]) => void
  ) {
    let hasRemoved = false;

    this._eventProxyBinds = this._eventProxyBinds.filter(
      ({
        targetInstance: predTargetInstance,
        eventName: predEventName,
        eventHandler: predEventHandler,
      }) => {
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

    // If there are no more proxy events for the target instance, remove its
    // auto destroy handler
    if (!this.getTargetInstanceQueueDepth(targetInstance)) {
      this._removeTargetInstanceDestroyHandler(targetInstance);
    }
  }

  /**
   * Removes all proxy handlers for all of the target instances.
   *
   * @return {void}
   */
  _removeAllProxyHandlers() {
    this._eventProxyBinds.forEach(
      ({ targetInstance, eventName, eventHandler }) =>
        this.removeProxyHandler(targetInstance, eventName, eventHandler)
    );
  }

  /**
   * Unregisters a the remote destroy handler from a single target instance.
   */
  _removeTargetInstanceDestroyHandler(targetInstance: PhantomCore) {
    const destroyHandler = this._targetDestroyHandlers.get(targetInstance);

    if (destroyHandler) {
      targetInstance.off(EVT_DESTROYED, destroyHandler);

      this._targetDestroyHandlers.delete(targetInstance);
    }
  }

  /**
   * Unregisters the remote destroy handlers from all of the target instances.
   *
   * @return {void}
   */
  _removeAllTargetInstanceDestroyHandlers() {
    for (const [targetInstance] of this._targetDestroyHandlers.entries()) {
      this._removeTargetInstanceDestroyHandler(targetInstance);
    }
  }

  /**
   * Retrieves the number of proxied events to the given target instance.
   */
  getTargetInstanceQueueDepth(targetInstance: PhantomCore) {
    return this._eventProxyBinds.reduce((acc, curr) => {
      const predTargetInstance = curr.targetInstance;
      if (targetInstance === predTargetInstance) {
        return acc + 1;
      } else {
        return acc;
      }
    }, 0);
  }

  override async destroy() {
    return super.destroy(() => {
      // Perform cleanup
      this._removeAllProxyHandlers();
      this._removeAllTargetInstanceDestroyHandlers();

      // Ensure no dangling references
      assert.strictEqual(this._eventProxyBinds.length, 0);
      assert.strictEqual([...this._targetDestroyHandlers].length, 0);
    });
  }
}
