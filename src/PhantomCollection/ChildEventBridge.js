const PhantomCore = require("../PhantomCore");
const { EVT_UPDATED } = PhantomCore;
const PhantomCollection = require("./PhantomCollection");
const {
  EVT_CHILD_INSTANCE_ADDED,
  EVT_CHILD_INSTANCE_REMOVED,
} = PhantomCollection;

const DEFAULT_BRIDGE_EVENT_NAMES = [EVT_UPDATED];

// TODO: Document
class ChildEventBridge extends PhantomCore {
  constructor(phantomCollection) {
    if (!(phantomCollection instanceof PhantomCollection)) {
      throw new TypeError(
        "phantomCollection is not a PhantomCollection instance"
      );
    }

    super();

    this._bridgeEventNames = [...DEFAULT_BRIDGE_EVENT_NAMES];

    // TODO: Map update / remove handling
    // EVT_CHILD_INSTANCE_ADDED,
    // EVT_CHILD_INSTANCE_REMOVED,

    // TODO: On each new instance, map all existing bridge events to it
  }

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
  addBridgeEventName(eventName) {
    this._bridgeEventNames = [...new Set(eventName)];

    this.emit(EVT_UPDATED);
  }

  // TODO: Document
  removeBridgeEventName(eventName) {
    this._bridgeEventNames = this._bridgeEventNames.filter(
      predicate => predicate !== eventName
    );

    this.emit(EVT_UPDATED);
  }

  // TODO: Document
  getBridgeEventNames() {
    return this._bridgeEventNames;
  }
}

module.exports = ChildEventBridge;
module.exports.EVT_UPDATED = EVT_UPDATED;
