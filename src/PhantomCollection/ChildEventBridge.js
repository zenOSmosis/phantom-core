const PhantomCore = require("../PhantomCore");
const { EVT_UPDATED } = PhantomCore;
const PhantomCollection = require("./PhantomCollection");
const {
  EVT_CHILD_INSTANCE_ADDED,
  EVT_CHILD_INSTANCE_REMOVED,
  KEY_META_CHILD_DESC_PROXY_EVENT_HANDLERS,
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

    // TODO: Map update / remove handling
    // EVT_CHILD_INSTANCE_ADDED,
    // EVT_CHILD_INSTANCE_REMOVED,

    // TODO: On each new instance, map all existing bridge events to it
  }

  /**
   * @return {Promise<void>}
   */
  async destroy() {
    // TODO: Unmap mapped event handlers from each child

    return super.destroy();
  }

  /**
   * Retrieves the specific event handlers this ChildEventBridge class has
   * attached to the given childInstance.
   *
   * @param {PhantomCore} childInstance
   * @return {Object | void} // TODO: Document type beyond just "Object"
   */
  getChildMappedEventHandlers(childInstance) {
    const metaDescription = this._phantomCollection.getInstanceChildMetaDescription(
      childInstance
    );

    if (metaDescription) {
      return metaDescription[KEY_META_CHILD_DESC_PROXY_EVENT_HANDLERS];
    }
  }

  // TODO: Document
  getChildMappedEventHandlerWithName(childInstance, eventName) {
    const mappedEventHandlers = this.getChildMappedEventHandlerWithName(
      childInstance
    );

    if (mappedEventHandlers) {
      return mappedEventHandlers[eventName];
    }
  }

  // TODO: Document
  /*
  setChildMappedEventHandlers(childInstance, proxyEventHandlers) {
    const metaDescription = this._phantomCollection.getInstanceChildMetaDescription(
      childInstance
    );

    if (!metaDescription) {
      throw new ReferenceError(
        "Could not obtain metaDescription of child instance from parent collection"
      );
    }

    metaDescription.proxyEventHandlers = { ...proxyEventHandlers };
  }
  */

  // TODO: Document
  // TODO: Provide way to unmap when this class is destructed
  /*
  _mapChildEvents(childInstance) {
    this._bridgeEventNames.forEach(eventName =>
      childInstance.on(eventName, eventData =>
        this._phantomCollection.emit(eventName, eventData)
      )
    );
  }
  */

  // TODO: Document
  _mapChildEvent(childInstance, eventName) {
    // TODO: Determine if already mapped before doing it again

    const _handleChildEvent = eventData =>
      this._phantomCollection.emit(eventName, eventData);

    childInstance.on(eventName, _handleChildEvent);
  }

  // TODO: Document
  _unmapChildEvent(childInstance, eventName) {
    // TODO: Handle
  }

  // TODO: Document
  addBridgeEventName(eventName) {
    const prevLength = this._bridgeEventNames.length;

    // Add only unique values
    this._bridgeEventNames = [...new Set(eventName)];

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
      this.emit(EVT_BRIDGE_EVENT_NAME_ADDED, eventName);
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
