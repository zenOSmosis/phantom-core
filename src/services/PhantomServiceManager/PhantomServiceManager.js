const PhantomCollection = require("../../PhantomCollection");
const PhantomServiceCore = require("../PhantomServiceCore");

const {
  /** @export */
  EVT_CHILD_INSTANCE_ADDED,
  /** @export */
  EVT_CHILD_INSTANCE_REMOVED,
  /** @export */
  EVT_UPDATED,
  /** @export */
  EVT_DESTROYED,
} = PhantomCollection;

// TODO: Document
class PhantomServiceManager extends PhantomCollection {
  /**
   * @return {Promise<void>}
   */
  async destroy() {
    // Destruct all services on collection destruct
    await this.destroyAllChildren();

    const ret = await super.destroy();

    return ret;
  }

  // TODO: Document
  addChild(ServiceClass) {
    if (ServiceClass === PhantomServiceCore) {
      throw new TypeError(
        "ServiceClass must derive from PhantomServiceCore but cannot be PhantomServiceCore itself"
      );
    }

    const cachedService = this.getChildWithKey(ServiceClass);

    if (cachedService) {
      return cachedService;
    }

    // Bind functionality to the service to be able to use other services,
    // using this service collection as the backend
    //
    // NOTE: This was engineered this way in order to not have to pass
    // arguments to the ServiceClass itself, thus making it easier to extend
    // services without having to think about needed constructor arguments
    ServiceClass.prototype._useServiceClassHandler = ChildServiceClass => {
      if (ChildServiceClass === ServiceClass) {
        throw new TypeError("Service cannot start a new instance of itself");
      }

      this.startServiceClass(ChildServiceClass);
    };

    // NOTE: Services are instantiated with the collection without arguments,
    // but may pass arguments down to the base ServiceCore class (i.e. for
    // setting initial state) in extension classes.  The extension classes
    // themselves won't be instantiated with any arguments set, however, by the
    // collection.
    const service = new ServiceClass();

    if (!(service instanceof PhantomServiceCore)) {
      throw new TypeError("Service is not a PhantomServiceCore instance");
    }

    return super.addChild(service, ServiceClass);
  }

  // TODO: Document
  // IMPORTANT: Making this async might be more trouble than its worth, if that
  // is ever a consideration
  startServiceClass(ServiceClass) {
    this.addChild(ServiceClass);
  }

  // TODO: Document
  async stopServiceClass(ServiceClass) {
    const cachedService = this.getServiceInstance(ServiceClass);

    if (cachedService) {
      cachedService.destroy();
    }
  }

  // TODO: Document
  getServiceInstance(ServiceClass) {
    const cachedService = this.getChildWithKey(ServiceClass);

    return cachedService;
  }

  // TODO: Document
  getServiceClasses() {
    return this.getKeys();
  }
}

module.exports = PhantomServiceManager;
module.exports.EVT_CHILD_INSTANCE_ADDED = EVT_CHILD_INSTANCE_ADDED;
module.exports.EVT_CHILD_INSTANCE_REMOVED = EVT_CHILD_INSTANCE_REMOVED;
module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
