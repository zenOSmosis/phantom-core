import PhantomCore, { EVT_UPDATED } from "../PhantomCore";
import PhantomCollection, {
  EVT_CHILD_INSTANCE_ADDED,
  EVT_CHILD_INSTANCE_REMOVED,
} from "./PhantomCollection";

const DEFAULT_BRIDGE_EVENT_NAMES = [EVT_UPDATED];

const EVT_BRIDGE_EVENT_NAME_ADDED = "bridge-event-name-added";
const EVT_BRIDGE_EVENT_NAME_REMOVED = "bridge-event-name-removed";

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
  protected _bridgeEventNames: string[];

  // TODO: [3.0.0] Use a Map instead
  protected _linkedChildEventHandlers: {
    [key: string]: {
      // TODO: [3.0.0] Redefine this
      key: string;
      value: (...args: any[]) => void;
    };
  };

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

    /**
     * @type {string[]} The event names this bridge currently (i.e. at any given
     * time) maintains mappings for events which can emit from child instances
     * and relay out the parent collection.
     */
    this._bridgeEventNames = [...DEFAULT_BRIDGE_EVENT_NAMES];

    this._linkedChildEventHandlers = {};

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
    const childUUID = childInstance.getUUID();

    // TODO: [3.0.0] Fix type
    // @ts-ignore
    this._linkedChildEventHandlers[childUUID] = {};

    // Add linked child event handlers
    this._bridgeEventNames.forEach(eventName =>
      this._mapChildEvent(childInstance, eventName)
    );
  }

  /**
   * Internally invoked when the collection removes a child.
   */
  _handleChildInstanceRemoved(childInstance: PhantomCore) {
    const childUUID = childInstance.getUUID();

    // Clear out linked child event handlers
    this._bridgeEventNames.forEach(eventName =>
      this._unmapChildEvent(childInstance, eventName)
    );

    delete this._linkedChildEventHandlers[childUUID];
  }

  /**
   * Adds an event name to a specific child and registers a wrapping event
   * handler which will proxy out the PhantomCollection when triggered.
   *
   * Subsequent attempts to add the same event will be silently ignored.
   */
  _mapChildEvent(childInstance: PhantomCore, eventName: string | symbol) {
    const childUUID = childInstance.getUUID();

    // Silently ignore previously linked events with same name
    // TODO: [3.0.0] Fix type
    // @ts-ignore
    if (!this._linkedChildEventHandlers[childUUID][eventName]) {
      // Re-emits the mapped child event data out the parent collection
      // TODO: [3.0.0] Fix type
      // @ts-ignore
      const _handleChildEvent = eventData => {
        this._phantomCollection.emit(eventName, eventData);
      };

      childInstance.on(eventName, _handleChildEvent);

      // Keep track of the event handler so it can be removed (via
      // this._unmapChildEvent)
      //
      // TODO: [3.0.0] Fix type
      // @ts-ignore
      this._linkedChildEventHandlers[childUUID][eventName] = _handleChildEvent;
    }
  }

  /**
   * Removes the wrapping event handler with the given even name from the
   * relevant child instance.
   */
  _unmapChildEvent(childInstance: PhantomCore, eventName: string | symbol) {
    const childUUID = childInstance.getUUID();
    // TODO: [3.0.0] Fix type
    // @ts-ignore
    const eventHandler = this._linkedChildEventHandlers[childUUID][eventName];

    if (eventHandler) {
      childInstance.off(eventName, eventHandler);

      // TODO: [3.0.0] Fix type
      // @ts-ignore
      delete this._linkedChildEventHandlers[childUUID][eventName];
    }
  }

  /**
   * Adds an event name which will bind to each child and emit out the
   * PhantomCollection when triggered.
   */
  addBridgeEventName(eventName: string | symbol) {
    const prevLength = this._bridgeEventNames.length;

    // Add only unique values
    //
    // TODO: [3.0.0] Fix type
    // @ts-ignore
    this._bridgeEventNames = [
      ...new Set([...this._bridgeEventNames, eventName]),
    ];

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
      predicate => predicate !== eventName
    );

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
        for (const eventName of this._bridgeEventNames) {
          this._unmapChildEvent(child, eventName);
        }
      }
    });
  }
}
