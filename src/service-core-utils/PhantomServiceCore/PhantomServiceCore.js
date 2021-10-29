const PhantomState = require("../../PhantomState");
const PhantomCollection = require("../../PhantomCollection");
const {
  /** @export */
  EVT_UPDATED,
  /** @export */
  EVT_DESTROYED,
} = PhantomState;

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
class PhantomServiceCore extends PhantomState {
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
    // Prevent duplicate collections from being bound
    if (this._collectionMap.get(CollectionClass)) {
      this.log.warn(
        `Collection class "${
          CollectionClass.name
        }" is already bound to service "${this.getClassName()}". Ignoring duplicate call.`
      );

      return;
    }

    const collectionInstance = new CollectionClass();

    // FIXME: (jh) A better check would be to determine this before
    // instantiation, if possible
    if (!(collectionInstance instanceof PhantomCollection)) {
      throw new TypeError("collectionInstance is not a PhantomCollection");
    }

    // Proxy collection EVT_UPDATED through the service core
    this.proxyOn(collectionInstance, EVT_UPDATED, () => this.emit(EVT_UPDATED));

    this._collectionMap.set(CollectionClass, collectionInstance);

    // Remove from collection map once collection is destructed
    collectionInstance.once(EVT_DESTROYED, () => {
      this._collectionMap.delete(CollectionClass);
    });
  }

  // TODO: Document
  async unbindCollectionClass(CollectionClass) {
    const collectionInstance = this.getCollectionInstance(CollectionClass);

    if (collectionInstance) {
      return collectionInstance.destroy();
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
  /**
   * @return {PhantomCollection[]} An array of PhantomCollection classes (not
   * instances).
   */
  getCollectionClasses() {
    // Coerce to array since map.keys() is not an array (it's an Iterator object)
    // @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/keys
    return [...this._collectionMap.keys()];
  }
}

module.exports = PhantomServiceCore;
module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
