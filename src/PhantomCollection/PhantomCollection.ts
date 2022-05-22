import assert from "assert";
import PhantomCore, {
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATED,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIMED_OUT,
  EVT_DESTROYED,
} from "../PhantomCore";
import ChildEventBridge from "./ChildEventBridge";
import { Class } from "../utils/class-utils/types";

export {
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATED,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIMED_OUT,
  EVT_DESTROYED,
};

/**
 * @event EVT_CHILD_INSTANCE_ADDED Emits with the PhantomCore instance which
 * was added.
 **/
export const EVT_CHILD_INSTANCE_ADDED = "child-instance-added";

/**
 * @event EVT_CHILD_INSTANCE_REMOVED Emits with the PhantomCore instance which
 * was removed.
 **/
export const EVT_CHILD_INSTANCE_REMOVED = "child-instance-removed";

// TODO: [3.0.0] Redeclare via type
const KEY_META_DESC_CHILD_KEY = "childKey";
const KEY_META_CHILD_BEFORE_DESTROY_HANDLER = "beforeDestroyHandler";

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
export default class PhantomCollection extends PhantomCore {
  /**
   * Loosely determines whether or not the given instance is a
   * PhantomCollection instance.
   *
   * IMPORTANT: This does not guarantee strict version integrity and bugs may
   * be present by using this across incompatible versions.
   *
   */
  static override getIsLooseInstance(instance: PhantomCollection & Class) {
    return Boolean(
      PhantomCore.getIsLooseInstance(instance) &&
        typeof instance.addChild === "function" &&
        typeof instance.removeChild === "function" &&
        typeof instance.getChildren === "function" &&
        typeof instance.getKeys === "function" &&
        typeof instance.broadcast === "function" &&
        typeof instance.removeAllChildren === "function" &&
        typeof instance.destroyAllChildren === "function"
    );
  }

  /**
   * Determines added and removed children from the given previous and current
   * children.
   *
   * NOTE: This accepts any parameter for previous and current children because
   * extension classes may use expose different child types to their own
   * implementors (i.e. media-stream-track-controller uses MediaStreamTrack
   * instances as exposed children in one of its classes).
   */
  static getChildrenDiff(
    prevChildren: PhantomCore[],
    currChildren: PhantomCore[]
  ) {
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

  protected _children: PhantomCore[];
  protected _childrenMetadata: Map<
    PhantomCore,
    {
      childKey?: unknown;
      beforeDestroyHandler: (...args: any[]) => void;
    }
  >;
  protected _childEventBridge: ChildEventBridge;

  constructor(initialPhantomInstances: PhantomCore[] = [], options = {}) {
    if (!Array.isArray(initialPhantomInstances)) {
      throw new TypeError("initialPhantomInstances must be an array");
    }

    super(options);

    /** @type {PhantomCore[]} */
    this._children = [];

    this._childrenMetadata = new Map();

    // Controls proxying of events emit from children out the collection itself
    this._childEventBridge = new ChildEventBridge(this);

    // Add all initial instances
    initialPhantomInstances.forEach(instance => this.addChild(instance));
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
   * Note: The optional key value is utilized to determine same instance
   * lookup. It can be useful when extending addChild functionality where the
   * passed in type is altered and it would be otherwise difficult to track
   * that altered type.
   *
   * @throws {TypeError}
   * @throws {ReferenceError}
   * @emits EVT_CHILD_INSTANCE_ADDED
   * @emits EVT_UPDATED
   */
  addChild(phantomCoreInstance: PhantomCore, key: unknown = null) {
    const prevInstanceWithKey = this.getChildWithKey(key);
    if (prevInstanceWithKey) {
      if (prevInstanceWithKey !== phantomCoreInstance) {
        throw new ReferenceError(
          `A duplicate key is trying to be added with a different PhantomCore instance than what is already registered with the key: "${key}"`
        );
      } else {
        // Silently ignore trying to add child with same key
        return;
      }
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
    const handleBeforeDestroy = () => {
      // Pre-filter the children which will be returned in getChildren() calls
      this._children = this._children.filter(
        child => child !== phantomCoreInstance
      );

      phantomCoreInstance.once(EVT_DESTROYED, () =>
        // Execute final event emissions from child and remove the associated
        // metadata
        this.removeChild(phantomCoreInstance)
      );
    };

    // Register w/ _childMetaDescriptions property
    this._childrenMetadata.set(phantomCoreInstance, {
      [KEY_META_DESC_CHILD_KEY]: key,
      // IMPORTANT: The handleBeforeDestroy is bound to the meta data so we can
      // arbitrarily remove it when removing the child from the collection
      [KEY_META_CHILD_BEFORE_DESTROY_HANDLER]: handleBeforeDestroy,
    });

    // NOTE: Not using proxyOnce here for two reasons:
    //  1. The EVT_BEFORE_DESTROY added event should be automatically removed
    //     once the child is removed
    //  2. proxyOn/ce adds an additional EVT_BEFORE_DESTROY handler on its own
    //     and if a child is wrapped in multiple collections it could result in
    //     potentially excessive event emitters
    phantomCoreInstance.once(EVT_BEFORE_DESTROY, handleBeforeDestroy);

    // IMPORTANT: Adding / removing children need to have new arrays defined
    // (vs. push / splice) in order to work as designed when using the children
    // array as dependencies of React hooks (i.e. in ReShell). Using the push
    // array method here will not update the hook dependencies as necessary
    // resulting in potentially stale state when used with React.
    this._children = [...this._children, phantomCoreInstance];

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
  removeChild(phantomCoreInstance: PhantomCore) {
    const childMetadata = this._childrenMetadata.get(phantomCoreInstance);

    if (childMetadata) {
      // Remove the destroyListener from the child
      const destroyListener =
        childMetadata[KEY_META_CHILD_BEFORE_DESTROY_HANDLER];
      phantomCoreInstance.off(EVT_BEFORE_DESTROY, destroyListener);

      // NOTE: These may have already been filtered out if removeChild is
      // utilized during the destruct phase, however, this additional
      // filtering is needed for arbitrary calls to removeChild
      this._children = this._children.filter(
        pred => pred !== phantomCoreInstance
      );

      // Remove the associated metadata
      this._childrenMetadata.delete(phantomCoreInstance);

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
   * Subsequent calls to getChildren() should maintain a stable referential
   * integrity unless one or more of the children wind up in a destructing
   * phase before the next attempt.
   *
   * @return {PhantomCore[]}
   */
  getChildren() {
    return this._children;
  }

  getChildWithKey(key: unknown = null) {
    // FIXME: (jh) Having the optional null key is here for backward
    // compatibility with other PhantomCore-based packages.  It should probably
    // be removed in a future version.
    // Related issue: https://github.com/zenOSmosis/phantom-core/issues/144

    if (!key) {
      return;
    }

    for (const [
      phantomCoreInstance,
      metadata,
    ] of this._childrenMetadata.entries()) {
      if (metadata[KEY_META_DESC_CHILD_KEY] === key) {
        return phantomCoreInstance;
      }
    }
  }

  /**
   * Retrieves the associative keys used with added children.
   */
  getKeys() {
    return [...this._childrenMetadata.entries()]
      .map(([, { [KEY_META_DESC_CHILD_KEY]: key }]) => key)
      .filter(key => key);
  }

  /**
   * Emits an event to all child instances.
   *
   * [one-to-many relationship]
   */
  broadcast(eventName: string, eventData: unknown) {
    for (const instance of this.getChildren()) {
      instance.emit(eventName, eventData);
    }
  }

  /**
   * Adds an event name which will bind to each child and emit out the
   * PhantomCollection when triggered.
   *
   * [many-to-one relationship]
   *
   * Any event added name here, when emit by any child, can be listened to by
   * attaching a listener to this class for the same event name, acting as if
   * the collection instance emit the event directly.
   */
  bindChildEventName(childEventName: string) {
    this._childEventBridge.addBridgeEventName(childEventName);
  }

  /**
   * Removes an event name from each child which previously would emit out the
   * PhantomCollection when triggered.
   *
   * [many-to-one relationship]
   */
  unbindChildEventName(childEventName: string) {
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
  override async destroy(destroyHandler?: (...args: any[]) => void) {
    return super.destroy(async () => {
      if (typeof destroyHandler === "function") {
        await destroyHandler();
      }

      // Empty out the collection
      this.removeAllChildren();

      // Ensure no dangling references
      assert.strictEqual(this._children.length, 0);
      assert.strictEqual([...this._childrenMetadata.values()].length, 0);

      await this._childEventBridge.destroy();
    });
  }
}
