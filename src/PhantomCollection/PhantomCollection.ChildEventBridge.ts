import assert from "assert";
import PhantomCore, { EVT_UPDATE } from "../PhantomCore";
import PhantomCollection, {
  EVT_CHILD_INSTANCE_ADD,
  EVT_CHILD_INSTANCE_REMOVE,
} from "./PhantomCollection";

const DEFAULT_BRIDGE_EVENT_NAMES = [EVT_UPDATE] as string[] & symbol[];

const EVT_BRIDGE_EVENT_NAME_ADD = "bridge-event-name-add";
const EVT_BRIDGE_EVENT_NAME_REMOVE = "bridge-event-name-remove";

type EventName = string | symbol;
type EventHandler = (...args: any[]) => void;
type EventMap = Map<EventName, EventHandler>;

export { EVT_UPDATE };

// TODO: [3.0.0] Redo description
/**
 * Handles many-to-one proxying of specified events of PhantomCollection
 * children out of the PhantomCollection itself.
 *
 * For each relevant event, when emit, the PhantomCollection emits the same
 * event and the same event data as the original child emitter emitted (i.e.
 * [for every mapped event] when childA emits EVT_UPDATE, collection emits
 * EVT_UPDATE as well).
 */
export default class PhantomCollectionChildEventBridge extends PhantomCore {
  protected _phantomCollection?: PhantomCollection;

  // TODO: [3.0.0] Rename?  This is should represent child -> collection
  // proxying
  /**
   * The event names this bridge currently (i.e. at any given
   * time) maintains mappings for events which can emit from child instances
   * and relay out the parent collection.
   */
  protected _bridgeEventNames: string[] & symbol[] = [
    ...DEFAULT_BRIDGE_EVENT_NAMES,
  ];

  // TODO: [3.0.0] Rename?  This is should represent child -> collection
  // proxying
  /**
   * A 2D map of event handlers attached to each respective PhantomCore instance.
   */
  protected _linkedChildEventHandlers: Map<PhantomCore, EventMap> = new Map();

  /**
   * IMPORTANT: This bridge is destructed by the collection itself and does not
   * need to listen for EVT_DESTROY from PhantomCollection.
   */
  constructor(phantomCollection: PhantomCollection) {
    // TODO: [3.0.0] Remove this check?
    if (!(phantomCollection instanceof PhantomCollection)) {
      throw new TypeError(
        "phantomCollection is not a PhantomCollection instance"
      );
    }

    super();

    this._phantomCollection = phantomCollection;
    this.registerCleanupHandler(() => delete this._phantomCollection);

    this._handleChildInstanceAdded = this._handleChildInstanceAdded.bind(this);
    this._handleChildInstanceRemoved =
      this._handleChildInstanceRemoved.bind(this);

    // Bind child _...added/removed handlers
    (() => {
      this.proxyOn(
        this._phantomCollection,
        EVT_CHILD_INSTANCE_ADD,
        this._handleChildInstanceAdded
      );

      this.proxyOn(
        this._phantomCollection,
        EVT_CHILD_INSTANCE_REMOVE,
        this._handleChildInstanceRemoved
      );
    })();

    // Invoked when new proxying event name is added
    this.on(EVT_BRIDGE_EVENT_NAME_ADD, eventName => {
      const children = this.getChildren();

      for (const child of children) {
        this._mapChildEvent(child, eventName);
      }
    });

    // Invoked when proxying event name is removed
    this.on(EVT_BRIDGE_EVENT_NAME_REMOVE, eventName => {
      const children = this.getChildren();

      for (const child of children) {
        this._unmapChildEvent(child, eventName);
      }
    });
  }

  /**
   * Retrieves the array of children of the PhantomCollection.
   */
  getChildren(): PhantomCore[] {
    return (
      (this._phantomCollection && this._phantomCollection.getChildren()) || []
    );
  }

  /**
   * Internally invoked when the PhantomCollection adds a new child.
   *
   * @param {PhantomCore} childInstance
   * @return {void}
   */
  _handleChildInstanceAdded(childInstance: PhantomCore): void {
    // Add linked child event handlers
    this._bridgeEventNames.forEach(eventName =>
      this._mapChildEvent(childInstance, eventName)
    );
  }

  /**
   * Internally invoked when the PhantomCollection removes a child.
   */
  _handleChildInstanceRemoved(childInstance: PhantomCore): void {
    // Clear out linked child event handlers
    this._bridgeEventNames.forEach(eventName =>
      this._unmapChildEvent(childInstance, eventName)
    );
  }

  // TODO: [3.0.0] Rename?  This is should represent child -> collection
  // proxying
  /**
   * Retrieves, or creates, a map of child events which will be re-emit (or
   * proxied) out the PhantomCollection.
   */
  _getChildEventMap(childInstance: PhantomCore): EventMap {
    const prev = this._linkedChildEventHandlers.get(childInstance);

    if (prev) {
      return prev;
    }

    const next: EventMap = new Map();
    this._linkedChildEventHandlers.set(childInstance, next);
    return next;
  }

  // TODO: [3.0.0] Rename?  This is should represent child -> collection
  // proxying
  /**
   * Unbinds, then removes the child event map for the given child.
   */
  _deleteChildEventMap(childInstance: PhantomCore): void {
    for (const eventName of this._bridgeEventNames) {
      this._unmapChildEvent(childInstance, eventName);
    }
  }

  // TODO: [3.0.0] Rename?  This is should represent child -> collection
  // proxying
  /**
   * Adds an event name to a specific child and registers a wrapping event
   * handler which will proxy out the PhantomCollection when triggered.
   *
   * Subsequent attempts to add the same event will be silently ignored.
   */
  _mapChildEvent(childInstance: PhantomCore, eventName: string | symbol): void {
    const childEventMap = this._getChildEventMap(childInstance);

    // Silently ignore previously linked events with same name
    if (!childEventMap.has(eventName)) {
      // Re-emits the mapped child event data out the parent collection
      const _handleChildEvent = (eventData: unknown) =>
        this._phantomCollection?.emit(eventName, eventData);

      // Bind to the child instance
      childInstance.on(eventName, _handleChildEvent);

      // Add to map recollection
      childEventMap.set(eventName, _handleChildEvent);
    }
  }

  // TODO: [3.0.0] Rename?  This is should represent child -> collection
  // proxying
  /**
   * Removes the wrapping event handler with the given even name from the
   * relevant child instance.
   */
  _unmapChildEvent(
    childInstance: PhantomCore,
    eventName: string | symbol
  ): void {
    const childEventMap = this._getChildEventMap(childInstance);

    const eventHandler = childEventMap.get(eventName);

    if (eventHandler) {
      // Unbind from the child instance
      childInstance.off(eventName, eventHandler);

      // Remove from map recollection
      childEventMap.delete(eventName);
    }

    // Remove container map if no more children
    if (![...childEventMap.values()].length) {
      this._linkedChildEventHandlers.delete(childInstance);
    }
  }

  // TODO: [3.0.0] Rename?  This is should represent collection -> child
  // proxying
  /**
   * Adds an event name which will bind to each child and emit out the
   * PhantomCollection when triggered.
   */
  addBridgeEventName(eventName: string | symbol): void {
    const prevLength = this._bridgeEventNames.length;

    // Add only unique values
    this._bridgeEventNames = [
      ...new Set([...this._bridgeEventNames, eventName]),
    ] as string[] & symbol[];

    const nextLength = this._bridgeEventNames.length;

    if (nextLength > prevLength) {
      this.emit(EVT_BRIDGE_EVENT_NAME_ADD, eventName);
    }
  }

  // TODO: [3.0.0] Rename?  This is should represent collection -> child
  // proxying
  /**
   * Removes an event name from each child which previously would emit out the
   * PhantomCollection when triggered.
   */
  removeBridgeEventName(eventName: string | symbol): void {
    const prevLength = this._bridgeEventNames.length;

    this._bridgeEventNames = this._bridgeEventNames.filter(
      (predicate: string | symbol) => predicate !== eventName
    ) as string[] & symbol[];

    const nextLength = this._bridgeEventNames.length;

    if (nextLength < prevLength) {
      this.emit(EVT_BRIDGE_EVENT_NAME_REMOVE, eventName);
    }
  }

  /**
   * Returns the mapped child event names which this class will proxy out the
   * collection.
   */
  getBridgeEventNames(): string[] & symbol[] {
    return this._bridgeEventNames;
  }

  override async destroy() {
    return super.destroy(async () => {
      // Unmap all associated bridge event handlers from the children
      const children = this.getChildren();
      for (const child of children) {
        this._deleteChildEventMap(child);
      }

      // Ensure we have destructed our event maps
      assert.strictEqual(
        [...this._linkedChildEventHandlers.values()].length,
        0
      );
    });
  }
}
