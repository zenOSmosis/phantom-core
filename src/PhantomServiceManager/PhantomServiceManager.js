const PhantomCollection = require("../PhantomCollection");
const PhantomServiceCore = require("../PhantomServiceCore");
const getClassName = require("../utils/class-utils/getClassName");
const {
  /** @export */
  EVT_NO_INIT_WARN,
  /** @export */
  EVT_READY,
  /** @export */
  // EVT_CHILD_INSTANCE_ADDED,
  /** @export */
  // EVT_CHILD_INSTANCE_REMOVED,
  /** @export */
  EVT_UPDATED,
  /** @export */
  EVT_BEFORE_DESTROY,
  /** @export */
  EVT_DESTROY_STACK_TIMED_OUT,
  /** @export */
  EVT_DESTROYED,
} = PhantomCollection;

/**
 * Manages a collection of PhantomServiceCore classes, treating each
 * PhantomServiceCore instance as a singleton in respect to an instance of the
 * current PhantomServiceManager instance.
 */
class PhantomServiceManager extends PhantomCollection {
  constructor() {
    super();

    // Keeps track of pending service class instances to help avoid maximum
    // recursion error if two or more services are circular dependencies of one
    // another
    this._pendingServiceClassInstanceSet = new Set();

    this.registerCleanupHandler(() => {
      this._pendingServiceClassInstanceSet.clear();
    });

    /**
     * In the event that a two or more services are circular dependencies of
     * each other, duplicate error messages could be logged until a potential
     * maximum call stack error occurs. This variable is utilized to determine
     * if a particular message has previously been logged, in order to not log
     * it again.
     *
     * @type {string}
     **/
    this._circularWarningMessages = [];
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

    this._pendingServiceClassInstanceSet.add(ServiceClass);

    let service;

    // IMPORTANT: This try / catch block is solely for checking instantiation
    // of SOMETHING, and additional error handling should be outside of this
    // block scope. This is to help diagnose if the required arguments are not
    // passed to super. Any other error checking in this try / catch can make
    // things trickier to manage.
    try {
      service = new ServiceClass({
        // While not EXPLICITLY required to make the functionality work, the
        // internal check inside of PhantomServiceCore for this property helps to
        // guarantee integrity of the PhantomServiceManager type
        manager: this,

        // Bind functionality to the service to be able to use other services,
        // using this service collection as the backend
        useServiceClassHandler: ChildServiceClass => {
          if (ChildServiceClass === ServiceClass) {
            throw new TypeError(
              "Service cannot start a new instance of itself"
            );
          }

          if (this._pendingServiceClassInstanceSet.has(ChildServiceClass)) {
            const circularWarningMessage = `ChildServiceClass "${getClassName(
              ChildServiceClass
            )}" is trying to be initialized before ServiceClass "${getClassName(
              ServiceClass
            )}" has had a chance to fully initialize. Are there circular dependencies in the constructors?`;

            if (
              !this._circularWarningMessages.includes(circularWarningMessage)
            ) {
              this._circularWarningMessages.push(circularWarningMessage);

              this.log.warn(circularWarningMessage);
            }
          }

          return this.startServiceClass(ChildServiceClass);
        },
      });
    } catch (err) {
      if (err instanceof TypeError) {
        const circularWarningMessage = `Could not instantiate service class "${getClassName(
          ServiceClass
        )}". Ensure that (...args) are passed through the constructor to the super instance.`;

        if (!this._circularWarningMessages.includes(circularWarningMessage)) {
          this._circularWarningMessages.push(circularWarningMessage);

          this.log.warn(circularWarningMessage);
        }
      }

      throw err;
    }

    if (!(service instanceof PhantomServiceCore)) {
      throw new TypeError(
        "Cannot initialize service which is not a PhantomServiceCore instance"
      );
    }

    super.addChild(service, ServiceClass);

    this._pendingServiceClassInstanceSet.delete(ServiceClass);

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
   * Stops associated class instance.
   *
   * @param {PhantomServiceCore} ServiceClass
   * @return {Promise<void>}
   */
  async stopServiceClass(ServiceClass) {
    const cachedService = this.getServiceInstance(ServiceClass);

    if (cachedService) {
      return cachedService.destroy();
    }
  }

  /**
   * Retrieves associated class instance of the given ServiceClass.
   *
   * @param {PhantomServiceCore} ServiceClass Non-instantiated service class.
   * @return {PhantomServiceCore} Instance of the service class.
   */
  getServiceInstance(ServiceClass) {
    const cachedService = this.getChildWithKey(ServiceClass);

    return cachedService;
  }

  /**
   * Retrieves the active PhantomServiceCore classes managed by this manager.
   *
   * @return {PhantomServiceCore[]}
   */
  getServiceClasses() {
    return this.getKeys();
  }

  /**
   * @param {Function} destroyHandler? [optional] If defined, will execute
   * prior to normal destruct operations for this class.
   * @return {Promise<void>}
   */
  async destroy(destroyHandler = () => null) {
    return super.destroy(async () => {
      await destroyHandler();

      // Destruct all services on collection destruct
      await this.destroyAllChildren();
    });
  }
}

module.exports = PhantomServiceManager;
module.exports.EVT_NO_INIT_WARN = EVT_NO_INIT_WARN;
module.exports.EVT_READY = EVT_READY;
// module.exports.EVT_CHILD_INSTANCE_ADDED = EVT_CHILD_INSTANCE_ADDED;
// module.exports.EVT_CHILD_INSTANCE_REMOVED = EVT_CHILD_INSTANCE_REMOVED;
module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_BEFORE_DESTROY = EVT_BEFORE_DESTROY;
module.exports.EVT_DESTROY_STACK_TIMED_OUT = EVT_DESTROY_STACK_TIMED_OUT;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
