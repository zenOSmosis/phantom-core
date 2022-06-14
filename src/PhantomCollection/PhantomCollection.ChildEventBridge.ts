import assert from "assert";
import { EventMap } from "../CommonEventEmitter";
import PhantomCore, { EVT_UPDATE } from "../PhantomCore";
import PhantomCollection, {
  EVT_CHILD_INSTANCE_ADD,
  EVT_CHILD_INSTANCE_REMOVE,
} from "./PhantomCollection";

const DEFAULT_BRIDGE_EVENT_NAMES = [EVT_UPDATE] as string[] & symbol[];

/**
 * Manages the relationships of proxied events to / from a collection and its
 * children.
 */
export default class PhantomCollectionChildEventBridge extends PhantomCore {
  protected _phantomCollection?: PhantomCollection;

  /**
   * The event names this bridge currently (i.e. at any given
   * time) maintains mappings for events which can emit from child instances
   * and relay out the parent collection.
   */
  protected _childToCollectionEventNames: string[] & symbol[] = [
    ...DEFAULT_BRIDGE_EVENT_NAMES,
  ];

  /**
   * A 2D map of event handlers attached to each respective PhantomCore instance.
   */
  protected _childEventProxyMaps: Map<PhantomCore, EventMap> = new Map();

  /**
   * IMPORTANT: This bridge is destructed by the collection itself and does not
   * need to listen for EVT_DESTROY from PhantomCollection.
   */
  constructor(phantomCollection: PhantomCollection) {
    if (!(phantomCollection instanceof PhantomCollection)) {
      throw new TypeError(
        "phantomCollection is not a PhantomCollection instance"
      );
    }

    super({
      title: phantomCollection.getTitle(),
    });

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
   * Adds an event name which will bind to each child and emit out the
   * PhantomCollection when triggered.
   */
  proxyCollectionEvent(eventName: string | symbol): void {
    const prevLength = this._childToCollectionEventNames.length;

    // Add only unique values
    this._childToCollectionEventNames = [
      ...new Set([...this._childToCollectionEventNames, eventName]),
    ] as string[] & symbol[];

    const nextLength = this._childToCollectionEventNames.length;

    if (nextLength > prevLength) {
      const children = this.getChildren();

      for (const child of children) {
        this._proxyChildEvent(child, eventName);
      }
    }
  }

  /**
   * Removes an event name from each child which previously would emit out the
   * PhantomCollection when triggered.
   */
  unproxyCollectionEvent(eventName: string | symbol): void {
    const prevLength = this._childToCollectionEventNames.length;

    this._childToCollectionEventNames =
      this._childToCollectionEventNames.filter(
        (predicate: string | symbol) => predicate !== eventName
      ) as string[] & symbol[];

    const nextLength = this._childToCollectionEventNames.length;

    if (nextLength < prevLength) {
      const children = this.getChildren();

      for (const child of children) {
        this._unproxyChildEvent(child, eventName);
      }
    }
  }

  /**
   * Returns the mapped child event names which this class will proxy out the
   * collection.
   */
  getProxiedCollectionEventNames(): string[] & symbol[] {
    return this._childToCollectionEventNames;
  }

  override async destroy(): Promise<void> {
    return super.destroy(async () => {
      // Unmap all associated bridge event handlers from the children
      const children = this.getChildren();
      for (const child of children) {
        this._deleteChildEventProxyMap(child);
      }

      // Ensure we have destructed our event maps
      assert.strictEqual([...this._childEventProxyMaps.values()].length, 0);
    });
  }

  /**
   * Internally invoked when the PhantomCollection adds a new child.
   */
  private _handleChildInstanceAdded(childInstance: PhantomCore): void {
    // Add linked child event handlers
    this._childToCollectionEventNames.forEach(eventName =>
      this._proxyChildEvent(childInstance, eventName)
    );
  }

  /**
   * Internally invoked when the PhantomCollection removes a child.
   */
  private _handleChildInstanceRemoved(childInstance: PhantomCore): void {
    // Clear out linked child event handlers
    this._childToCollectionEventNames.forEach(eventName =>
      this._unproxyChildEvent(childInstance, eventName)
    );
  }

  /**
   * Retrieves, or creates, a map of child events which will be re-emit (or
   * proxied) out the PhantomCollection.
   */
  private _getChildEventProxyMap(childInstance: PhantomCore): EventMap {
    const prev = this._childEventProxyMaps.get(childInstance);

    if (prev) {
      return prev;
    }

    const next: EventMap = new Map();
    this._childEventProxyMaps.set(childInstance, next);
    return next;
  }

  /**
   * Unbinds, then removes the child event map for the given child.
   */
  private _deleteChildEventProxyMap(childInstance: PhantomCore): void {
    for (const eventName of this._childToCollectionEventNames) {
      this._unproxyChildEvent(childInstance, eventName);
    }
  }

  /**
   * Sets up a child => collection event proxy.
   *
   * Subsequent attempts to add the same event will be silently ignored.
   */
  private _proxyChildEvent(
    childInstance: PhantomCore,
    eventName: string | symbol
  ): void {
    const childEventMap = this._getChildEventProxyMap(childInstance);

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

  /**
   * Tears down a child => collection event proxy.
   */
  private _unproxyChildEvent(
    childInstance: PhantomCore,
    eventName: string | symbol
  ): void {
    const childEventMap = this._getChildEventProxyMap(childInstance);

    const eventHandler = childEventMap.get(eventName);

    if (eventHandler) {
      // Unbind from the child instance
      childInstance.off(eventName, eventHandler);

      // Remove from map recollection
      childEventMap.delete(eventName);
    }

    // Remove container map if no more children
    if (![...childEventMap.values()].length) {
      this._childEventProxyMaps.delete(childInstance);
    }
  }
}
