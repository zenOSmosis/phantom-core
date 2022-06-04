import assert from "assert";
import PhantomCore from "../PhantomCore";
import _DestructibleEventEmitter, {
  EVT_DESTROY,
} from "../_DestructibleEventEmitter";

/**
 * The bindable types which may be proxied via EventProxyStack.
 */
export enum EventProxyStackBindTypes {
  On = "on",
  Once = "once",
}

/**
 * Provides event proxy management for PhantomCore's, proxyOn, proxyOnce, and
 * proxyOff methods.
 *
 * Internally it binds the events to the remote target instance(s) and manages
 * their handling.
 *
 * NOTE: A single EVT_DESTROY method is also attached to every target
 * instance to perform shutdown handling.
 */
export default class EventProxyStack extends _DestructibleEventEmitter {
  protected _eventProxyBinds: {
    targetInstance: PhantomCore;
    eventName: string | symbol;
    eventHandler: (...args: any[]) => void;
  }[] = [];
  protected _targetDestroyHandlers: Map<PhantomCore, (...args: any[]) => void> =
    new Map();

  /**
   * Adds the given proxy handler to the given target instance.
   */
  addProxyHandler(
    bindType: EventProxyStackBindTypes.On | EventProxyStackBindTypes.Once,
    targetInstance: PhantomCore,
    eventName: string | symbol,
    eventHandler: (...args: any[]) => void
  ): void {
    if (!Object.values(EventProxyStackBindTypes).includes(bindType)) {
      throw new ReferenceError(`Unhandled value "${bindType}" for bindType`);
    }

    this._eventProxyBinds.push({ targetInstance, eventName, eventHandler });

    // Bind the event handler to the target instance
    targetInstance[bindType](eventName, eventHandler);

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
      // emits EVT_DESTROY
      targetInstance.once(EVT_DESTROY, instanceDestroyHandler);
    }
  }

  /**
   * Removes the given proxy handler from the given target instance.
   */
  removeProxyHandler(
    targetInstance: PhantomCore,
    eventName: string | symbol,
    eventHandler: (...args: any[]) => void
  ): void {
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
   */
  _removeAllProxyHandlers(): void {
    this._eventProxyBinds.forEach(
      ({ targetInstance, eventName, eventHandler }) =>
        this.removeProxyHandler(targetInstance, eventName, eventHandler)
    );
  }

  /**
   * Unregisters a the remote destroy handler from a single target instance.
   */
  _removeTargetInstanceDestroyHandler(targetInstance: PhantomCore): void {
    const destroyHandler = this._targetDestroyHandlers.get(targetInstance);

    if (destroyHandler) {
      targetInstance.off(EVT_DESTROY, destroyHandler);

      this._targetDestroyHandlers.delete(targetInstance);
    }
  }

  /**
   * Unregisters the remote destroy handlers from all of the target instances.
   */
  _removeAllTargetInstanceDestroyHandlers(): void {
    for (const [targetInstance] of this._targetDestroyHandlers.entries()) {
      this._removeTargetInstanceDestroyHandler(targetInstance);
    }
  }

  /**
   * Retrieves the number of proxied events to the given target instance.
   */
  getTargetInstanceQueueDepth(targetInstance: PhantomCore): number {
    return this._eventProxyBinds.reduce((acc, curr) => {
      const predTargetInstance = curr.targetInstance;
      if (targetInstance === predTargetInstance) {
        return acc + 1;
      } else {
        return acc;
      }
    }, 0);
  }

  override async destroy(): Promise<void> {
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
