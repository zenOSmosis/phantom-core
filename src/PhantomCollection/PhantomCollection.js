const PhantomCore = require("../PhantomCore");
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
} = PhantomCore;

/** @export */
const EVT_CHILD_INSTANCE_ADDED = "child-instance-added";
/** @export */
const EVT_CHILD_INSTANCE_REMOVED = "child-instance-removed";

/** @export */
const KEY_META_CHILD_DESC_INSTANCE = "phantomCoreInstance";
/** @export */
const KEY_META_DESC_CHILD_KEY = "childKey";
/** @export */
const KEY_META_CHILD_DESTROY_LISTENER = "destroyListener";

/**
 * A PhantomCollection contains an array of unique PhantomCore instances
 * which are bound as child instances.
 *
 * Events can be sent to a children by broadcasting them, and events can be
 * bridged from every child which will emit out the collection as if the
 * collection itself generated the event.
 *
 * In addition, this collection strives to include all of the properties which
 * Techopedia defines as a collection:
 * @see https://www.techopedia.com/definition/25317/collection
 *  - Each group element represents an object with a similar purpose
 *  - Group size varies dynamically during runtime
 *  - There must be access to an individual element through a search function
 *    based on a specific key
 *  - There must be a sort or iteration through the group elements
 */
class PhantomCollection extends PhantomCore {
  /**
   * Loosely determines whether or not the given instance is a
   * PhantomCollection instance.
   *
   * IMPORTANT: This does not guarantee strict version integrity and bugs may
   * be present by using this across incompatible versions.
   *
   * @param {Object} instance
   * @return {boolean}
   */
  static getIsLooseInstance(instance) {
    if (
      PhantomCore.getIsLooseInstance(instance) &&
      typeof instance.addChild === "function" &&
      typeof instance.removeChild === "function" &&
      typeof instance.getChildren === "function" &&
      typeof instance.getKeys === "function" &&
      typeof instance.getChildMetaDescription === "function" &&
      typeof instance.broadcast === "function" &&
      typeof instance.removeAllChildren === "function" &&
      typeof instance.destroyAllChildren === "function"
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Determines added and removed children from the given previous and current
   * children.
   *
   * NOTE: This accepts any parameter for previous and current children because
   * extension classes may use expose different child types to their own
   * implementors (i.e. media-stream-track-controller uses MediaStreamTrack
   * instances as exposed children in one of its classes).
   *
   * @param {any[]} prevChildren All of the previous children.
   * @param {any[]} currChildren All of the current children.
   * @return {Object<added: any[], removed: any[]>} Contains children added and
   * removed.
   */
  static getChildrenDiff(prevChildren, currChildren) {
    const added = currChildren.filter(
      predicate => !prevChildren.includes(predicate)
    );

    const removed = prevChildren.filter(
      predicate => !currChildren.includes(predicate)
    );

    return {
      added,
      removed,
    };
  }

  /**
   * @param {PhantomCore[]} initialPhantomInstances
   * @param {Object} options? [default = {}]
   */
  constructor(initialPhantomInstances = [], options = {}) {
    if (!Array.isArray(initialPhantomInstances)) {
      throw new TypeError("initialPhantomInstances must be an array");
    }

    super(options);

    /**
     * An array of objects with PhantomCore instances as well as destroy
     * listener for each.
     *
     * IMPORTANT: Use this.getChildren() instead of iterating on this variable
     * directly.
     *
     * @type {Object{phantomCoreInstance: PhantomCore, destroyListener: function}[]}
     */
    this._childMetaDescriptions = [];

    // IMPORTANT: ChildEventBridge has to be lazy-loaded due to the fact that it
    // needs to be able to read the exports from this file, including the
    // PhantomCollection class itself
    const ChildEventBridge = require("./ChildEventBridge");

    // Controls proxying of events emit from children out the collection itself
    this._childEventBridge = new ChildEventBridge(this);

    // Add all initial instances
    initialPhantomInstances.forEach(instance => this.addChild(instance));

    /**
     * The number of children this instance has at any particular time.
     *
     * This is automatically maintained and can be useful for extension classes
     * which need to know this variable to not need to run a
     * getChildren().length on fast iteration cycles.
     *
     * NOTE: A conventional getter was not utilized for this because it needs
     * to be memoized, and not calculated for every call.
     *
     * @type {number}
     */
    this._lenChildren = this.getChildren().length;

    // Handle keeping this._lenChildren accurate
    (() => {
      const _handleChildrenUpdate = () =>
        (this._lenChildren = this.getChildren().length);

      this.on(EVT_CHILD_INSTANCE_ADDED, _handleChildrenUpdate);
      this.on(EVT_CHILD_INSTANCE_REMOVED, _handleChildrenUpdate);
    })();
  }

  /**
   * Destroys all currently associated children in the collection.
   *
   * IMPORTANT: This is a helper method for extension classes; It is not to be
   * called internally in this base class.
   *
   * @return {Promise<void>}
   */
  async destroyAllChildren() {
    const children = this.getChildren();
    return Promise.all(children.map(child => child.destroy()));
  }

  /**
   * Iterator handler for PhantomCollection.
   *
   * Example usage to retrieve an array of all children:
   * [...collection]
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/iterator
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol
   *
   * @return {PhantomCore<IterableIterator>} FIXME: (jh) This may not be the correct type,
   * but close enough?
   * @throws {TypeError} After instance destruction, future attempts to try to
   * iterate will throw a TypeError.
   */
  get [Symbol.iterator]() {
    const children = this.getChildren();

    return function* () {
      for (const child of children) {
        yield child;
      }
    };
  }

  /**
   * Adds a PhantomCore instance to the collection.
   *
   * @param {PhantomCore} phantomCoreInstance
   * @param {any} key? [default = null] If set, this value is utilized to
   * determine same instance lookup. It can be useful when extending this
   * method functionality where the passed in type is altered and it would be
   * otherwise difficult to track that altered type.
   * @throws {TypeError}
   * @throws {ReferenceError}
   * @emits EVT_CHILD_INSTANCE_ADDED
   * @emits EVT_UPDATED
   * @return {void}
   */
  addChild(phantomCoreInstance, key = null) {
    if (this.getChildWithKey(key)) {
      // Silently ignore trying to add child with same key
      return;
    }

    if (!PhantomCore.getIsLooseInstance(phantomCoreInstance)) {
      // FIXME: (jh) Create a way to bypass this error when doing development or prototypes
      // Perhaps use a global state tied into LOA (i.e. root-controlled global state / config)
      // @see https://github.com/zenOSmosis/phantom-core/issues/60
      throw new TypeError(
        "PhantomCollection cannot add a child that is not a known PhantomCore instance. Perhaps the child is of a different PhantomCore symbol than this library recognizes."
      );
    }

    if (this.getIsSameInstance(phantomCoreInstance)) {
      throw new ReferenceError(
        "A PhantomCollection cannot be passed to itself"
      );
    }

    if (phantomCoreInstance.getIsDestroyed()) {
      throw new ReferenceError("Cannot add a destroyed PhantomCore instance");
    }

    // Ensure instance isn't already part of the collection
    for (const instance of this.getChildren()) {
      if (instance.getIsSameInstance(phantomCoreInstance)) {
        // Silently ignore repeated attempts to add same child
        return;
      }
    }

    // Called when the collection instance is destroyed before the collection
    const destroyListener = () => {
      if (!phantomCoreInstance.getIsDestroyed()) {
        this.removeChild(phantomCoreInstance);
      }
    };

    // Register w/ _childMetaDescriptions property
    this._childMetaDescriptions.push({
      [KEY_META_CHILD_DESC_INSTANCE]: phantomCoreInstance,
      [KEY_META_DESC_CHILD_KEY]: key,
      [KEY_META_CHILD_DESTROY_LISTENER]: destroyListener,
    });

    phantomCoreInstance.once(EVT_DESTROYED, destroyListener);

    this.emit(EVT_CHILD_INSTANCE_ADDED, phantomCoreInstance);
    this.emit(EVT_UPDATED);
  }

  /**
   * Removes a PhantomCore instance from the collection.
   *
   * @param {PhantomCore} phantomCoreInstance
   * @emits EVT_CHILD_INSTANCE_REMOVED
   * @emits EVT_UPDATED
   * @return {void}
   */
  removeChild(phantomCoreInstance) {
    const prevLength = this._childMetaDescriptions.length;

    // Unregister from _childMetaDescriptions property
    this._childMetaDescriptions = this._childMetaDescriptions.filter(
      metaDescription => {
        const instance = metaDescription[KEY_META_CHILD_DESC_INSTANCE];

        if (!phantomCoreInstance.getIsSameInstance(instance)) {
          // Retain in returned instances
          return true;
        } else {
          // Remove destroy handler from instance
          phantomCoreInstance.off(
            EVT_DESTROYED,
            metaDescription[KEY_META_CHILD_DESTROY_LISTENER]
          );

          // Remove from returned instances
          return false;
        }
      }
    );

    const nextLength = this._childMetaDescriptions.length;

    if (nextLength < prevLength) {
      this.emit(EVT_CHILD_INSTANCE_REMOVED, phantomCoreInstance);
      this.emit(EVT_UPDATED);
    }
  }

  /**
   * Removes all children from the collection.
   *
   * @return {void}
   */
  removeAllChildren() {
    for (const child of this.getChildren()) {
      this.removeChild(child);
    }
  }

  /**
   * Retrieves an array of PhantomCore children for this collection.
   *
   * Destructed children will not appear in this list.
   *
   * @return {PhantomCore[]}
   */
  getChildren() {
    return this._childMetaDescriptions
      .map(({ [KEY_META_CHILD_DESC_INSTANCE]: childInstance }) => childInstance)
      .filter(child => !child.getIsDestroying() && !child.getIsDestroyed());
  }

  /**
   * @param {any} key? [default = null]
   * @return {PhantomCore | void}
   */
  getChildWithKey(key = null) {
    if (!key) {
      return;
    }

    const childMetaDescriptions = this._childMetaDescriptions;

    const matchedMetaDescription = childMetaDescriptions.find(
      ({ [KEY_META_DESC_CHILD_KEY]: testKey }) => testKey === key
    );

    if (matchedMetaDescription) {
      return matchedMetaDescription[KEY_META_CHILD_DESC_INSTANCE];
    }
  }

  /**
   * Retrieves the associative keys used with added children.
   *
   * @return {any[]}
   */
  getKeys() {
    return this._childMetaDescriptions.map(
      ({ [KEY_META_DESC_CHILD_KEY]: key }) => key
    );
  }

  /**
   * Retrieves collection-based metadata regarding the given child instance.
   *
   * @param {PhantomCore} childInstance
   * @return {Object}
   */
  getChildMetaDescription(childInstance) {
    return this._childMetaDescriptions.find(
      ({ [KEY_META_CHILD_DESC_INSTANCE]: phantomCoreInstance }) =>
        Object.is(phantomCoreInstance, childInstance)
    );
  }

  /**
   * Emits an event to all child instances.
   *
   * one-to-many relationship
   *
   * @param {string | symbol} eventName
   * @param {any} eventData
   * @return {void}
   */
  broadcast(eventName, eventData) {
    for (const instance of this.getChildren()) {
      instance.emit(eventName, eventData);
    }
  }

  /**
   * Adds an event name which will bind to each child and emit out the
   * PhantomCollection when triggered.
   *
   * many-to-one relationship
   *
   * Any event added name here, when emit by any child, can be listened to by
   * attaching a listener to this class for the same event name, acting as if
   * the collection instance emit the event directly.
   *
   * @param {string | symbol} childEventName
   * @return {void}
   */
  bindChildEventName(childEventName) {
    this._childEventBridge.addBridgeEventName(childEventName);
  }

  /**
   * Removes an event name from each child which previously would emit out the
   * PhantomCollection when triggered.
   *
   * many-to-one relationship
   *
   * @param {string | symbol} childEventName
   * @return {void}
   */
  unbindChildEventName(childEventName) {
    this._childEventBridge.removeBridgeEventName(childEventName);
  }

  /**
   * Retrieves the event names which are mapped to every child which will emit
   * out the PhantomCollection when triggered.
   *
   * @return {string[] | symbol[]} Can be a mix of string and symbol types.
   */
  getBoundChildEventNames() {
    return this._childEventBridge.getBridgeEventNames();
  }

  /**
   * @param {Function} destroyHandler? [optional] If defined, will execute
   * prior to normal destruct operations for this class.
   * @return {Promise<void>}
   */
  async destroy(destroyHandler = () => null) {
    return super.destroy(async () => {
      await destroyHandler();

      // Empty out the collection
      await this.removeAllChildren();

      await this._childEventBridge.destroy();
    });
  }
}

module.exports = PhantomCollection;

module.exports.EVT_NO_INIT_WARN = EVT_NO_INIT_WARN;
module.exports.EVT_READY = EVT_READY;
module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_BEFORE_DESTROY = EVT_BEFORE_DESTROY;
module.exports.EVT_DESTROY_STACK_TIMED_OUT = EVT_DESTROY_STACK_TIMED_OUT;
module.exports.EVT_DESTROYED = EVT_DESTROYED;

module.exports.EVT_CHILD_INSTANCE_ADDED = EVT_CHILD_INSTANCE_ADDED;
module.exports.EVT_CHILD_INSTANCE_REMOVED = EVT_CHILD_INSTANCE_REMOVED;

// FIXME: (jh) Other than for testing, I'm not sure if these keys should be
// exported. May need to consider refactoring.
module.exports.KEY_META_CHILD_DESC_INSTANCE = KEY_META_CHILD_DESC_INSTANCE;
module.exports.KEY_META_DESC_CHILD_KEY = KEY_META_DESC_CHILD_KEY;
module.exports.KEY_META_CHILD_DESTROY_LISTENER =
  KEY_META_CHILD_DESTROY_LISTENER;
