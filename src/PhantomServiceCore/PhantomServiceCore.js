const PhantomState = require("../PhantomState");
const PhantomCollection = require("../PhantomCollection");
const {
  /** @export */
  EVT_NO_INIT_WARN,
  /** @export */
  EVT_READY,
  /** @export */
  EVT_UPDATED,
  /** @export */
  EVT_BEFORE_DESTROY,
  /** @export */
  EVT_DESTROY_STACK_TIMED_OUT,
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
    super(null, {
      // Services register immediately in their managers, but are not ready to
      // go until the _init method has run
      isAsync: true,
    });

    // A map of collections, attached to this service core
    this._collectionMap = new Map();

    this.__MANAGED__useServiceClassHandler = useServiceClassHandler;

    // Ensure we're properly bound to a service manager
    try {
      const PhantomServiceManager = require("../PhantomServiceManager");
      if (!(manager instanceof PhantomServiceManager)) {
        throw new ReferenceError(
          "PhantomServiceCore must be started by a PhantomServiceManager"
        );
      }

      if (typeof this.__MANAGED__useServiceClassHandler !== "function") {
        throw new ReferenceError(
          "__MANAGED__useServiceClassHandler property should be set by the PhantomServiceManager which manages this service"
        );
      }
    } catch (err) {
      this.destroy();

      throw err;
    }

    // TODO: Refactor w/ setInitialState?
    /*
    this._state = Object.seal(
      PhantomServiceCore.mergeOptions(DEFAULT_STATE, initialState)
    );
    */

    // Set default title
    this.setTitle(`[non-aliased-service]:${this.getClassName()}`);

    // Auto-init this async service.
    //
    // IMPORTANT: The setImmediate handler fixes issue where _init is invoked
    // before extension constructors have a chance to initialize, despite the
    // fact it is an async method (without it, it fails a test case in
    // service-core.instantiation.test.js)
    (global || window).setImmediate(() => {
      this._init();
    });
  }

  /**
   * This can be extended with any custom async handling.  Custom
   * implementations must call super._init().
   *
   * @return {Promise<void>}
   */
  async _init() {
    return super._init();
  }

  /**
   * Starts a new service class instance, or retrieves an existing one which
   * matches the given class, unique to the associated PhantomServiceManager.
   *
   * This service class is treated as a singleton, relative to the associated
   * PhantomServiceManager instead of the global scope.
   *
   * @param {PhantomServiceCore} ServiceClass
   * @return {PhantomServiceCore} Service class instance.
   */
  useServiceClass(ServiceClass) {
    return this.__MANAGED__useServiceClassHandler(ServiceClass);
  }

  /**
   * Binds a PhantomCollection to this service, instantiating it a singleton
   * relative to service instance (instead of the global scope), proxying
   * EVT_UPDATED events from the collection through the service.
   *
   * IMPORTANT: Bound collection classes shared with multiple services using
   * bindCollectionClass will use separate instances of the collection.
   *
   * @param {PhantomCollection} CollectionClass
   * @return {PhantomCollection} Instance of CollectionClass.
   */
  bindCollectionClass(CollectionClass) {
    const prevCollectionInstance = this._collectionMap.get(CollectionClass);

    if (prevCollectionInstance) {
      return prevCollectionInstance;
    }

    const collectionInstance = new CollectionClass();

    // FIXME: (jh) A better check would be to determine this before
    // instantiation, if possible
    //
    // IMPORTANT: Loose instance detection is provided here so that collections
    // may be bound from different PhantomCore versions.  It does not guarantee
    // strict version integrity.
    if (!PhantomCollection.getIsLooseInstance(collectionInstance)) {
      throw new TypeError("collectionInstance is not a PhantomCollection");
    }

    // Proxy collection EVT_UPDATED through the service core
    this.proxyOn(collectionInstance, EVT_UPDATED, data =>
      this.emit(EVT_UPDATED, data)
    );

    this._collectionMap.set(CollectionClass, collectionInstance);

    // Remove from collection map once collection is destructed
    collectionInstance.once(EVT_DESTROYED, () => {
      this._collectionMap.delete(CollectionClass);
    });

    return collectionInstance;
  }

  /**
   * Unbinds the given CollectionClass from this service and destructs the
   * instance.
   *
   * @param {CollectionClass} CollectionClass
   * @return {Promise<void>}
   */
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

  /**
   * @param {Function} destroyHandler? [optional] If defined, will execute
   * prior to normal destruct operations for this class.
   * @return {Promise<void>}
   */
  async destroy(destroyHandler = () => null) {
    return super.destroy(async () => {
      await destroyHandler();

      // Destruct all attached collections
      await Promise.all(
        [...this._collectionMap.values()].map(collection =>
          collection.destroy()
        )
      );
    });
  }
}

module.exports = PhantomServiceCore;
module.exports.EVT_NO_INIT_WARN = EVT_NO_INIT_WARN;
module.exports.EVT_READY = EVT_READY;
module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_BEFORE_DESTROY = EVT_BEFORE_DESTROY;
module.exports.EVT_DESTROY_STACK_TIMED_OUT = EVT_DESTROY_STACK_TIMED_OUT;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
