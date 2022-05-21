import assert from "assert";
import PhantomCore, { EVT_UPDATED } from "../PhantomCore";
import PhantomCollection, {
  EVT_CHILD_INSTANCE_ADDED,
  EVT_CHILD_INSTANCE_REMOVED,
} from "./PhantomCollection";

const DEFAULT_BRIDGE_EVENT_NAMES = [EVT_UPDATED] as string[] & symbol[];

const EVT_BRIDGE_EVENT_NAME_ADDED = "bridge-event-name-added";
const EVT_BRIDGE_EVENT_NAME_REMOVED = "bridge-event-name-removed";

type EventName = string | symbol;
type EventHandler = (...args: any[]) => void;
type EventMap = Map<EventName, EventHandler>;

export { EVT_UPDATED };

// TODO: [3.0.0] Rename to PhantomCollectionChildEventBridge?
/**
 * Handles many-to-one proxying of specified events of PhantomCollection
 * children out of the PhantomCollection itself.
 *
 * For each relevant event, when emit, the PhantomCollection emits the same
 * event and the same event data as the original child emitter emitted (i.e.
 * [for every mapped event] when childA emits EVT_UPDATED, collection emits
 * EVT_UPDATED as well).
 */
export default class ChildEventBridge extends PhantomCore {
  protected _phantomCollection: PhantomCollection;

  /**
   * The event names this bridge currently (i.e. at any given
   * time) maintains mappings for events which can emit from child instances
   * and relay out the parent collection.
   */
  protected _bridgeEventNames: string[] & symbol[] = [
    ...DEFAULT_BRIDGE_EVENT_NAMES,
  ];

  protected _linkedChildEventHandlers: Map<PhantomCore, EventMap> = new Map();

  /**
   * IMPORTANT: This bridge is destructed by the collection itself and does not
   * need to listen for EVT_DESTROYED from PhantomCollection.
   */
  constructor(phantomCollection: PhantomCollection) {
    // TODO: [3.0.0] Remove this check
    if (!(phantomCollection instanceof PhantomCollection)) {
      throw new TypeError(
        "phantomCollection is not a PhantomCollection instance"
      );
    }

    super();

    /**
     * @type {PhantomCollection} The parent PhantomCollection.
     */
    this._phantomCollection = phantomCollection;
    this.registerCleanupHandler(() => delete this._phantomCollection);

    this._handleChildInstanceAdded = this._handleChildInstanceAdded.bind(this);
    this._handleChildInstanceRemoved =
      this._handleChildInstanceRemoved.bind(this);

    // Bind child _...added/removed handlers
    (() => {
      this.proxyOn(
        this._phantomCollection,
        EVT_CHILD_INSTANCE_ADDED,
        this._handleChildInstanceAdded
      );

      this.proxyOn(
        this._phantomCollection,
        EVT_CHILD_INSTANCE_REMOVED,
        this._handleChildInstanceRemoved
      );
    })();

    // Invoked when new proxying event name is added
    this.on(EVT_BRIDGE_EVENT_NAME_ADDED, eventName => {
      const children = this.getChildren();

      for (const child of children) {
        this._mapChildEvent(child, eventName);
      }
    });

    // Invoked when proxying event name is removed
    this.on(EVT_BRIDGE_EVENT_NAME_REMOVED, eventName => {
      const children = this.getChildren();

      for (const child of children) {
        this._unmapChildEvent(child, eventName);
      }
    });
  }

  /**
   * Retrieves an array of PhantomCore children for the associated
   * PhantomCollection.
   *
   * @return {PhantomCore[]}
   */
  getChildren() {
    return (
      (this._phantomCollection && this._phantomCollection.getChildren()) || []
    );
  }

  /**
   * Internally invoked when the collection adds a new child.
   *
   * @param {PhantomCore} childInstance
   * @return {void}
   */
  _handleChildInstanceAdded(childInstance: PhantomCore) {
    // Add linked child event handlers
    this._bridgeEventNames.forEach(eventName =>
      this._mapChildEvent(childInstance, eventName)
    );
  }

  /**
   * Internally invoked when the collection removes a child.
   */
  _handleChildInstanceRemoved(childInstance: PhantomCore) {
    // Clear out linked child event handlers
    this._bridgeEventNames.forEach(eventName =>
      this._unmapChildEvent(childInstance, eventName)
    );
  }

  /**
   * Retrieves, or creates, the event map which is associated to the given
   * child instance.
   *
   * This map contains the proxies events which are emit out the collection,
   * once the child emits the event.
   */
  _getChildEventMap(childInstance: PhantomCore) {
    const prev = this._linkedChildEventHandlers.get(childInstance);

    if (prev) {
      return prev;
    }

    const next = new Map() as EventMap;
    this._linkedChildEventHandlers.set(childInstance, next);
    return next;
  }

  /**
   * Unbinds, then removes the child event map for the given child.
   */
  _deleteChildEventMap(childInstance: PhantomCore) {
    for (const eventName of this._bridgeEventNames) {
      this._unmapChildEvent(childInstance, eventName);
    }
  }

  /**
   * Adds an event name to a specific child and registers a wrapping event
   * handler which will proxy out the PhantomCollection when triggered.
   *
   * Subsequent attempts to add the same event will be silently ignored.
   */
  _mapChildEvent(childInstance: PhantomCore, eventName: string | symbol) {
    const childEventMap = this._getChildEventMap(childInstance);

    // Silently ignore previously linked events with same name
    if (!childEventMap.has(eventName)) {
      // Re-emits the mapped child event data out the parent collection
      // TODO: [3.0.0] Fix type
      // @ts-ignore
      const _handleChildEvent = eventData =>
        this._phantomCollection.emit(eventName, eventData);

      // Bind to the child instance
      childInstance.on(eventName, _handleChildEvent);

      // Add to map recollection
      childEventMap.set(eventName, _handleChildEvent);
    }
  }

  /**
   * Removes the wrapping event handler with the given even name from the
   * relevant child instance.
   */
  _unmapChildEvent(childInstance: PhantomCore, eventName: string | symbol) {
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

  /**
   * Adds an event name which will bind to each child and emit out the
   * PhantomCollection when triggered.
   */
  addBridgeEventName(eventName: string | symbol) {
    const prevLength = this._bridgeEventNames.length;

    // Add only unique values
    this._bridgeEventNames = [
      ...new Set([...this._bridgeEventNames, eventName]),
    ] as string[] & symbol[];

    const nextLength = this._bridgeEventNames.length;

    if (nextLength > prevLength) {
      this.emit(EVT_BRIDGE_EVENT_NAME_ADDED, eventName);
    }
  }

  /**
   * Removes an event name from each child which previously would emit out the
   * PhantomCollection when triggered.
   */
  removeBridgeEventName(eventName: string | symbol) {
    const prevLength = this._bridgeEventNames.length;

    this._bridgeEventNames = this._bridgeEventNames.filter(
      (predicate: string | symbol) => predicate !== eventName
    ) as string[] & symbol[];

    const nextLength = this._bridgeEventNames.length;

    if (nextLength < prevLength) {
      this.emit(EVT_BRIDGE_EVENT_NAME_REMOVED, eventName);
    }
  }

  /**
   * Returns the mapped child event names which this class will proxy out the
   * collection.
   *
   * @return {string[] | symbol[]} Can be a mix of strings and symbols.
   */
  getBridgeEventNames() {
    return this._bridgeEventNames;
  }

  /**
   * @return {Promise<void>}
   */
  async destroy() {
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
