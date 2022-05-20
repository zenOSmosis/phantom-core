import PhantomCore, { EVT_UPDATED } from "../PhantomCore";
import PhantomCollection, {
  EVT_CHILD_INSTANCE_ADDED,
  EVT_CHILD_INSTANCE_REMOVED,
} from "./PhantomCollection";

const DEFAULT_BRIDGE_EVENT_NAMES = [EVT_UPDATED];

const EVT_BRIDGE_EVENT_NAME_ADDED = "bridge-event-name-added";
const EVT_BRIDGE_EVENT_NAME_REMOVED = "bridge-event-name-removed";

export { EVT_UPDATED };

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
  /**
   * IMPORTANT: This bridge is destructed by the collection itself and does not
   * need to listen for EVT_DESTROYED from PhantomCollection.
   *
   * @param {PhantomCollection} phantomCollection The collection this bridge
   * should be bound to.
   */
  constructor(phantomCollection) {
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

    /** @type {{key: uuid, value: {key: eventName, value: eventHandler}}} */
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
  _handleChildInstanceAdded(childInstance) {
    const childUUID = childInstance.getUUID();

    this._linkedChildEventHandlers[childUUID] = {};

    // Add linked child event handlers
    this._bridgeEventNames.forEach(eventName =>
      this._mapChildEvent(childInstance, eventName)
    );
  }

  /**
   * Internally invoked when the collection removes a child.
   *
   * @param {PhantomCore} childInstance
   * @return {void}
   */
  _handleChildInstanceRemoved(childInstance) {
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
   *
   * @param {PhantomCore} childInstance
   * @param {string | symbol} eventName
   * @return {void}
   */
  _mapChildEvent(childInstance, eventName) {
    const childUUID = childInstance.getUUID();

    // Silently ignore previously linked events with same name
    if (!this._linkedChildEventHandlers[childUUID][eventName]) {
      // Re-emits the mapped child event data out the parent collection
      const _handleChildEvent = eventData => {
        this._phantomCollection.emit(eventName, eventData);
      };

      childInstance.on(eventName, _handleChildEvent);

      // Keep track of the event handler so it can be removed (via
      // this._unmapChildEvent)
      this._linkedChildEventHandlers[childUUID][eventName] = _handleChildEvent;
    }
  }

  /**
   * Removes the wrapping event handler with the given even name from the
   * relevant child instance.
   *
   * @param {PhantomCore} childInstance
   * @param {string | symbol} eventName
   * @return {void}
   */
  _unmapChildEvent(childInstance, eventName) {
    const childUUID = childInstance.getUUID();
    const eventHandler = this._linkedChildEventHandlers[childUUID][eventName];

    if (eventHandler) {
      childInstance.off(eventName, eventHandler);

      delete this._linkedChildEventHandlers[childUUID][eventName];
    }
  }

  /**
   * Adds an event name which will bind to each child and emit out the
   * PhantomCollection when triggered.
   *
   * @param {string | symbol} eventName
   * @return {void}
   */
  addBridgeEventName(eventName) {
    const prevLength = this._bridgeEventNames.length;

    // Add only unique values
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
   *
   * @param {string | symbol} eventName
   * @return {void}
   */
  removeBridgeEventName(eventName) {
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
