import PhantomCore, { CommonOptions } from "../PhantomCore";
import PhantomCollection, {
  EVT_ERROR,
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
  EVT_CHILD_INSTANCE_ADD,
  EVT_CHILD_INSTANCE_REMOVE,
} from "../PhantomCollection";
import PhantomServiceCore from "../PhantomServiceCore";
import getClassName from "../utils/class-utils/getClassName";
import { Class, Constructor } from "../types";

export {
  EVT_ERROR,
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
  EVT_CHILD_INSTANCE_ADD,
  EVT_CHILD_INSTANCE_REMOVE,
};

/**
 * Manages a collection of PhantomServiceCore classes, treating each
 * PhantomServiceCore instance as a singleton in respect to an instance of the
 * current PhantomServiceManager instance.
 */
export default class PhantomServiceManager extends PhantomCollection<PhantomServiceCore> {
  protected _pendingServiceClassInstanceSet: Set<Class<PhantomServiceCore>>;
  protected _circularWarningMessages: string[];

  constructor(options: CommonOptions = {}) {
    super([], options);

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
     **/
    this._circularWarningMessages = [];
  }

  /**
   * @throws {TypeError}
   */
  override addChild() {
    throw new TypeError(
      "addChild cannot be called directly on PhantomServiceManager"
    );
  }

  /**
   * Starts a new ServiceCoreClass instance or retrieves an existing one, if
   * the same class is managed by this manager.
   *
   * In the context of this manager instance, the service class is treated as a
   * singleton, while new instances of the class can be bound to other manager
   * instances.
   *
   * @throws {TypeError}
   * @throws {ReferenceError}
   * @emits EVT_CHILD_INSTANCE_ADD
   * @emits EVT_UPDATE
   */
  addClass(ServiceClass: Constructor<PhantomServiceCore>): PhantomServiceCore {
    if (ServiceClass === PhantomServiceCore) {
      throw new TypeError(
        "ServiceClass must derive from PhantomServiceCore but cannot be PhantomServiceCore itself"
      );
    }

    const cachedService = this.getChildWithKey(
      ServiceClass
    ) as PhantomServiceCore;

    if (cachedService) {
      return cachedService;
    }

    this._pendingServiceClassInstanceSet.add(ServiceClass);

    let service: PhantomServiceCore;

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
        useServiceClassHandler: (
          ChildServiceClass: Constructor<PhantomServiceCore>
        ) => {
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
   * Starts associated class instance.
   *
   * If the class is already instantiated in this manager's session, this call
   * will be ignored.
   *
   * @see this.addChild
   */
  startServiceClass(
    ServiceClass: Constructor<PhantomServiceCore>
  ): PhantomServiceCore {
    return this.addClass(ServiceClass);
  }

  /**
   * Stops associated class instance.
   */
  async stopServiceClass(
    ServiceClass: Class<PhantomServiceCore>
  ): Promise<void> {
    const cachedService = this.getServiceInstance(ServiceClass);

    if (cachedService) {
      return cachedService.destroy();
    }
  }

  /**
   * Retrieves associated class instance of the given ServiceClass.
   *
   * If no class instance is found it will return nothing.
   */
  getServiceInstance(
    ServiceClass: Class<PhantomServiceCore>
  ): PhantomCore | void {
    const cachedService = this.getChildWithKey(ServiceClass);

    return cachedService;
  }

  /**
   * Retrieves the underlying JavaScript classes which have been instantiated
   * into running services.
   */
  override getKeys(): PhantomServiceCore[] {
    return super.getKeys() as PhantomServiceCore[];
  }

  /**
   * Retrieves the active PhantomServiceCore classes managed by this manager.
   */
  getServiceClasses(): PhantomServiceCore[] {
    return this.getKeys();
  }

  override async destroy(destroyHandler?: () => void): Promise<void> {
    return super.destroy(async () => {
      if (typeof destroyHandler === "function") {
        await destroyHandler();
      }

      // Destruct all services on collection destruct
      await this.destroyAllChildren();
    });
  }
}
