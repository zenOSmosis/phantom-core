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

  /**
   * Starts a new ServiceCoreClass instance or retrieves an existing one, if
   * the same class is managed by this manager.
   *
   * In the context of this manager instance, the service class is treated as a
   * singleton, while new instances of the class can be bound to other manager
   * instances.
   *
   * @param {PhantomServiceCore} ServiceClass
   * @throws {TypeError}
   * @throws {ReferenceError}
   * @emits EVT_CHILD_INSTANCE_ADDED
   * @emits EVT_UPDATED
   * @return {PhantomServiceCore} Returns the instance of the added service class
   */
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

    const service = new ServiceClass({
      // While not EXPLICITLY required to make the functionality work, the
      // internal check inside of PhantomServiceCore for this property helps to
      // guarantee integrity of the PhantomServiceManager type
      manager: this,

      // Bind functionality to the service to be able to use other services,
      // using this service collection as the backend
      useServiceClassHandler: ChildServiceClass => {
        if (ChildServiceClass === ServiceClass) {
          throw new TypeError("Service cannot start a new instance of itself");
        }

        return this.startServiceClass(ChildServiceClass);
      },
    });

    if (!(service instanceof PhantomServiceCore)) {
      throw new TypeError("Service is not a PhantomServiceCore instance");
    }

    super.addChild(service, ServiceClass);

    return service;
  }

  /**
   * Alias for this.addChild
   *
   * @see this.addChild
   */
  startServiceClass(ServiceClass) {
    return this.addChild(ServiceClass);
  }

  /**
   *
   * @param {PhantomServiceCore} ServiceClass
   */
  async stopServiceClass(ServiceClass) {
    const cachedService = this.getServiceInstance(ServiceClass);

    if (cachedService) {
      return cachedService.destroy();
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
