import PhantomState, {
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
} from "../PhantomState";
import PhantomCollection from "../PhantomCollection";
import PhantomServiceManager from "../PhantomServiceManager";
import { Class, ClassInstance } from "../utils/class-utils/types";

export {
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
};

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
//
// IMPORTANT: It is OKAY to use this as an async!
export default class PhantomServiceCore extends PhantomState {
  // TODO: [3.0.0] Use generic for value i.e. PhantomInstance<PhantomCollection>
  protected _collectionMap: Map<Class<PhantomCollection>, PhantomCollection>;

  // TODO: [3.0.0] Rename?
  protected __MANAGED__useServiceClassHandler: (
    arg: Class<PhantomServiceCore>
  ) => ClassInstance;

  constructor({
    manager,
    useServiceClassHandler,
  }: {
    manager: PhantomServiceManager;
    useServiceClassHandler: () => Class<PhantomServiceCore>;
  }) {
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
   * Starts a new service class instance, or retrieves an existing one which
   * matches the given class, unique to the associated PhantomServiceManager.
   *
   * This service class is treated as a singleton, relative to the associated
   * PhantomServiceManager instead of the global scope.
   */
  useServiceClass(ServiceClass: Class<PhantomServiceCore>): ClassInstance {
    return this.__MANAGED__useServiceClassHandler(ServiceClass);
  }

  /**
   * Binds a PhantomCollection to this service, instantiating it a singleton
   * relative to service instance (instead of the global scope), proxying
   * EVT_UPDATE events from the collection through the service.
   *
   * IMPORTANT: Bound collection classes shared with multiple services using
   * bindCollectionClass will use separate instances of the collection.
   */
  // TODO: [3.0.0] Fix any return type
  bindCollectionClass(CollectionClass: Class<PhantomCollection>) {
    const prevCollectionInstance = this._collectionMap.get(CollectionClass);

    if (prevCollectionInstance) {
      return prevCollectionInstance;
    }

    // TODO: [3.0.0] Fix this type
    // @ts-ignore
    const collectionInstance = new CollectionClass();

    // FIXME: (jh) A better check would be to determine this before
    // instantiation, if possible
    //
    // IMPORTANT: Loose instance detection is provided here so that collections
    // may be bound from different PhantomCore versions. It does not guarantee
    // strict version integrity.
    if (!PhantomCollection.getIsLooseInstance(collectionInstance)) {
      throw new TypeError("collectionInstance is not a PhantomCollection");
    }

    // Proxy collection EVT_UPDATE through the service core
    this.proxyOn(collectionInstance, EVT_UPDATE, data =>
      this.emit(EVT_UPDATE, data)
    );

    this._collectionMap.set(CollectionClass, collectionInstance);

    // Remove from collection map once collection is destructed
    collectionInstance.once(EVT_DESTROY, () => {
      this._collectionMap.delete(CollectionClass);
    });

    return collectionInstance;
  }

  /**
   * Unbinds the given CollectionClass from this service and destructs the
   * instance.
   */
  async unbindCollectionClass(
    CollectionClass: Class<PhantomCollection>
  ): Promise<void> {
    const collectionInstance = this.getCollectionInstance(CollectionClass);

    if (collectionInstance) {
      return collectionInstance.destroy();
    }
  }

  /**
   * Retrieves the PhantomCollection with the given class.
   *
   * If no collection instance is found with the given class it will return
   * nothing.
   */
  getCollectionInstance(
    CollectionClass: Class<PhantomCollection>
  ): PhantomCollection | undefined {
    return this._collectionMap.get(CollectionClass);
  }

  /**
   * Retrieves an array of PhantomCollection classes (not instances) which are
   * bound to the service.
   */
  getCollectionClasses(): Class<PhantomCollection>[] {
    // Coerce to array since map.keys() is not an array (it's an Iterator object)
    // @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/keys
    return [...this._collectionMap.keys()];
  }

  override async destroy(destroyHandler?: () => void): Promise<void> {
    return super.destroy(async () => {
      if (typeof destroyHandler === "function") {
        await destroyHandler();
      }

      // Destruct all attached collections
      await Promise.all(
        [...this._collectionMap.values()].map(collection =>
          collection.destroy()
        )
      );
    });
  }
}
