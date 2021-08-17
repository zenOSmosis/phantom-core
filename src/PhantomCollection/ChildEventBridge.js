const PhantomCore = require("../PhantomCore");
const { EVT_UPDATED } = PhantomCore;
const PhantomCollection = require("./PhantomCollection");
const {
  EVT_CHILD_INSTANCE_ADDED,
  EVT_CHILD_INSTANCE_REMOVED,
} = PhantomCollection;

const DEFAULT_BRIDGE_EVENT_NAMES = [EVT_UPDATED];

const EVT_BRIDGE_EVENT_NAME_ADDED = "bridge-event-name-added";
const EVT_BRIDGE_EVENT_NAME_REMOVED = "bridge-event-name-removed";

/**
 * Handles many-to-one proxying of specified events of PhantomCollection
 * children out of the PhantomCollection itself.
 *
 * For each relevant event, when emit, the PhantomCollection emits the same
 * event and the same event data as the original child emitter emitted (i.e.
 * [for every mapped event] when childA emits EVT_UPDATED, collection emits
 * EVT_UPDATED as well).
 */
class ChildEventBridge extends PhantomCore {
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

    /**
     * @type {string[]} The event names this bridge currently (i.e. at any given
     * time) maintains mappings for events which can emit from child instances
     * and relay out the parent collection.
     */
    this._bridgeEventNames = [...DEFAULT_BRIDGE_EVENT_NAMES];

    // TODO: Document
    this._linkedChildEventHandlers = {};

    this._handleChildInstanceAdded = this._handleChildInstanceAdded.bind(this);
    this._handleChildInstanceRemoved = this._handleChildInstanceRemoved.bind(
      this
    );

    // Bind child _...added/removed handlers
    (() => {
      this._phantomCollection.on(
        EVT_CHILD_INSTANCE_ADDED,
        this._handleChildInstanceAdded
      );

      this._phantomCollection.on(
        EVT_CHILD_INSTANCE_REMOVED,
        this._handleChildInstanceRemoved
      );
    })();

    this.on(EVT_BRIDGE_EVENT_NAME_ADDED, eventName => {
      const children = this.getChildren();

      for (const child of children) {
        this._mapChildEvent(child, eventName);
      }
    });

    this.on(EVT_BRIDGE_EVENT_NAME_REMOVED, eventName => {
      const children = this.getChildren();

      for (const child of children) {
        this._unmapChildEvent(child, eventName);
      }
    });
  }

  /**
   * @return {Promise<void>}
   */
  async destroy() {
    // Unbind child _...added/removed handlers
    (() => {
      this._phantomCollection.off(
        EVT_CHILD_INSTANCE_ADDED,
        this._handleChildInstanceAdded
      );

      this._phantomCollection.off(
        EVT_CHILD_INSTANCE_REMOVED,
        this._handleChildInstanceRemoved
      );
    })();

    // TODO: Unmap mapped event handlers from each child

    return super.destroy();
  }

  /**
   * Retrieves an array of PhantomCore children for the associated
   * PhantomCollection.
   *
   * @return {PhantomCore[]}
   */
  getChildren() {
    return this._phantomCollection.getChildren();
  }

  // TODO: Document
  _handleChildInstanceAdded(childInstance) {
    // TODO: Map all existing bridge events to this instance
    // TODO: Remove
    /*
    console.log({
      childInstanceAdded: childInstance,
    });
    */

    const childUUID = childInstance.getUUID();

    this._linkedChildEventHandlers[childUUID] = {};

    // Add linked child event handlers
    this._bridgeEventNames.forEach(eventName =>
      this._mapChildEvent(childInstance, eventName)
    );
  }

  // TODO: Document
  _handleChildInstanceRemoved(childInstance) {
    const childUUID = childInstance.getUUID();

    // Clear out linked child event handlers
    this._bridgeEventNames.forEach(eventName =>
      this._unmapChildEvent(childInstance, eventName)
    );

    delete this._linkedChildEventHandlers[childUUID];
  }

  // TODO: Document
  _mapChildEvent(childInstance, eventName) {
    const childUUID = childInstance.getUUID();

    // Silently ignore previously linked events with same name
    if (!this._linkedChildEventHandlers[childUUID][eventName]) {
      // Re-emits the mapped child event data out the parent collection
      const _handleChildEvent = eventData => {
        this._phantomCollection.emit(eventName, eventData);
      };

      childInstance.on(eventName, _handleChildEvent);

      this._linkedChildEventHandlers[childUUID][eventName] = _handleChildEvent;
    }
  }

  // TODO: Document
  _unmapChildEvent(childInstance, eventName) {
    const childUUID = childInstance.getUUID();
    const eventHandler = this._linkedChildEventHandlers[childUUID][eventName];

    if (eventHandler) {
      childInstance.off(eventName, eventHandler);

      delete this._linkedChildEventHandlers[childUUID][eventName];
    }
  }

  // TODO: Document
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

  // TODO: Document
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
   * @return {string[]}
   */
  getBridgeEventNames() {
    return this._bridgeEventNames;
  }
}

module.exports = ChildEventBridge;
module.exports.EVT_UPDATED = EVT_UPDATED;
