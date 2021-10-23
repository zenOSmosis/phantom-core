const PhantomCore = require("../../PhantomCore");
const PhantomCollection = require("../../PhantomCollection");
const {
  /** @export */
  EVT_UPDATED,
  /** @export */
  EVT_DESTROYED,
} = PhantomCore;

// TODO: Configure reporter channel (base class PhantomState, SyncObject or
// equivalent (not sure if SyncObject would be useful here, but could enable
// remote reporting))
//
//
// TODO: Document
//
// TODO: Consider this: Thought about extending PhantomCollection, instead,
// since retaining a localized state of children (which happen to be
// collections as well), but want to keep it open to the possibility of
// managing other types of collection-type data without the possibility of a
// conflict (i.e. collections based on role, etc.)
class PhantomServiceCore extends PhantomCore {
  constructor({ manager, useServiceClassHandler }) {
    super();

    // Ensure we're managed by a PhantomServiceManager
    (() => {
      const PhantomServiceManager = require("../PhantomServiceManager");

      if (!(manager instanceof PhantomServiceManager)) {
        throw new ReferenceError(
          "PhantomServiceCore must be started by a PhantomServiceManager"
        );
      }
    })();

    this.__MANAGED__useServiceClassHandler = useServiceClassHandler;

    if (typeof this.__MANAGED__useServiceClassHandler !== "function") {
      throw new ReferenceError(
        "__MANAGED__useServiceClassHandler property should be set by the PhantomServiceManager which manages this service"
      );
    }

    // TODO: Ensure this is cleared once destructed
    this._state = {};

    // TODO: Refactor w/ setInitialState?
    /*
    this._state = Object.seal(
      PhantomServiceCore.mergeOptions(DEFAULT_STATE, initialState)
    );
    */

    // A map of collections, attached to this service core
    this._collectionMap = new Map();

    // Set default title
    this.setTitle(`[non-aliased-service]:${this.getClassName()}`);
  }

  /**
   * @return {Promise<void>}
   */
  async destroy() {
    // Destruct all attached collections
    await Promise.all(
      [...this._collectionMap.values()].map(collection => collection.destroy())
    );

    return super.destroy();
  }

  // TODO: Use consistency in naming
  /**
   * Starts a new service class instance, or retrieves an existing one which
   * matches the given class.
   *
   * @param {PhantomServiceCore} ServiceClass
   * @return {PhantomServiceCore} Service class instance
   */
  useServiceClass(ServiceClass) {
    return this.__MANAGED__useServiceClassHandler(ServiceClass);
  }

  // TODO: Implement ability to get attached service classes

  // TODO: Use consistency in naming
  /**
   * Binds a non-instantiated PhantomCollection to this service, propagating
   * EVT_UPDATED through the class.
   *
   * IMPORTANT: Bound collection classes shared with multiple services using
   * bindCollectionClass will use separate instances of the collection.
   *
   * @param {PhantomCollection} CollectionClass
   * @return {void}
   */
  bindCollectionClass(CollectionClass) {
    const collectionInstance = new CollectionClass();

    // FIXME: (jh) A better check would be to determine this before
    // instantiation, if possible
    if (!(collectionInstance instanceof PhantomCollection)) {
      throw new TypeError("collectionInstance is not a PhantomCollection");
    }

    // Proxy collection EVT_UPDATED through the service core
    this.proxyOn(collectionInstance, EVT_UPDATED, () => this.emit(EVT_UPDATED));

    this._collectionMap.set(CollectionClass, collectionInstance);
  }

  // TODO: Document
  unbindCollectionClass(CollectionClass) {
    const instance = this.getCollectionInstance(CollectionClass);

    if (instance) {
      instance.destroy();
    }
  }

  /**
   * @param {PhantomCollection} CollectionClass
   * @return {PhantomCollection} instance
   */
  getCollectionInstance(CollectionClass) {
    return this._collectionMap.get(CollectionClass);
  }

  // TODO: Document
  getCollectionClasses() {
    return this._collectionMap.keys();
  }

  /**
   * Sets partial next state, shallow merging any new changes.
   *
   * @param {Object} partialNextState
   * @emits EVT_UPDATED
   * @return {void}
   */
  setState(partialNextState = {}) {
    if (typeof partialNextState !== "object") {
      throw new TypeError("setState must be called with an object");
    }

    // IMPORTANT: This state is only shallow merged due to deep merging not
    // working for certain native types
    this._state = { ...this._state, ...partialNextState };

    // IMPORTANT: At this time, emit is invoked regardless if there are actual
    // updates
    this.emit(EVT_UPDATED, partialNextState);
  }

  // TODO: Document
  getState() {
    return this._state;
  }
}

module.exports = PhantomServiceCore;
module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
