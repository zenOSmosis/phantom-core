import { Class } from "../types";
import { PhantomCollectionChildKey } from "./types";
import assert from "assert";
import PhantomCore, {
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
  CommonOptions,
  EventListener,
} from "../PhantomCore";
import ChildEventBridge from "./PhantomCollection.ChildEventBridge";

export {
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
};

/**
 * @event EVT_CHILD_INSTANCE_ADD Emits with the PhantomCore instance which
 * was added to the collection.
 **/
export const EVT_CHILD_INSTANCE_ADD = "child-instance-add";

/**
 * @event EVT_CHILD_INSTANCE_REMOVE Emits with the PhantomCore instance which
 * was removed from the collection.
 **/
export const EVT_CHILD_INSTANCE_REMOVE = "child-instance-remove";

/**
 * A PhantomCollection is an array-like collection of unique PhantomCore
 * instances which are bound as child instances.
 *
 * Together they form a single collective, where the collection acts as an
 * event proxy for designated events that emit on a particular child's behalf.
 *
 * Reverse proxying also comes into play, where each child can emit an event
 * (i.e. broadcast) that is sent via the collection.
 *
 * To the outside world, all of the instances in a collection are represented as
 * a single unit, by the collection itself.
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
   */
  static getChildrenDiff(
    prevChildren: PhantomCore[],
    currChildren: PhantomCore[]
  ): { added: PhantomCore[]; removed: PhantomCore[] } {
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

  protected _children: PhantomCore[] = [];
  protected _childrenMetadata: Map<
    PhantomCore,
    {
      key?: PhantomCollectionChildKey;
      onBeforeDestroy: EventListener;
    }
  > = new Map();
  protected _childEventBridge: ChildEventBridge = new ChildEventBridge(this);

  constructor(
    initialPhantomInstances: PhantomCore[] = [],
    options: CommonOptions = {}
  ) {
    if (!Array.isArray(initialPhantomInstances)) {
      throw new TypeError("initialPhantomInstances must be an array");
    }

    super(options);

    // Add all initial instances
    initialPhantomInstances.forEach(instance => this.addChild(instance));
  }

  /**
   * Destroys all currently associated children in the collection.
   *
   * IMPORTANT: This is a helper method for extension classes; It is not to be
   * called internally in this base class.
   */
  async destroyAllChildren(): Promise<void> {
    const children = this.getChildren();
    await Promise.all(children.map(child => child.destroy()));
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
   * @throws {TypeError} After instance destruction, future attempts to try to
   * iterate will throw a TypeError.
   */
  get [Symbol.iterator](): IterableIterator<PhantomCore> {
    const children = this.getChildren();

    // TODO: [3.0.0] Fix "Type 'typeof Symbol.iterator' does not satisfy the
    // constraint '(...args: any) => any'"
    //
    // @ts-ignore
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
   * @emits EVT_CHILD_INSTANCE_ADD
   * @emits EVT_UPDATE
   */
  addChild(
    phantomCoreInstance: PhantomCore,
    key: PhantomCollectionChildKey = null
  ): void {
    const prevInstanceWithKey = this.getChildWithKey(key);
    if (prevInstanceWithKey) {
      if (prevInstanceWithKey !== phantomCoreInstance) {
        throw new ReferenceError(
          `A duplicate key is trying to be added with a different PhantomCore instance than what is already registered with the key: "${String(
            key
          )}"`
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

      phantomCoreInstance.once(EVT_DESTROY, () =>
        // Execute final event emissions from child and remove the associated
        // metadata
        this.removeChild(phantomCoreInstance)
      );
    };

    // Register w/ _childMetaDescriptions property
    this._childrenMetadata.set(phantomCoreInstance, {
      key,
      onBeforeDestroy: handleBeforeDestroy,
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

    this.emit(EVT_CHILD_INSTANCE_ADD, phantomCoreInstance);
    this.emit(EVT_UPDATE);
  }

  /**
   * Removes a PhantomCore instance from the collection.
   *
   * @param {PhantomCore} phantomCoreInstance
   * @emits EVT_CHILD_INSTANCE_REMOVE
   * @emits EVT_UPDATE
   * @return {void}
   */
  removeChild(phantomCoreInstance: PhantomCore): void {
    const childMetadata = this._childrenMetadata.get(phantomCoreInstance);

    if (childMetadata) {
      // Remove the destroyListener from the child
      const destroyListener = childMetadata.onBeforeDestroy;
      phantomCoreInstance.off(EVT_BEFORE_DESTROY, destroyListener);

      // NOTE: These may have already been filtered out if removeChild is
      // utilized during the destruct phase, however, this additional
      // filtering is needed for arbitrary calls to removeChild
      this._children = this._children.filter(
        pred => pred !== phantomCoreInstance
      );

      // Remove the associated metadata
      this._childrenMetadata.delete(phantomCoreInstance);

      this.emit(EVT_CHILD_INSTANCE_REMOVE, phantomCoreInstance);
      this.emit(EVT_UPDATE);
    }
  }

  /**
   * Removes all children from the collection.
   */
  removeAllChildren(): void {
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
   */
  getChildren(): PhantomCore[] {
    return this._children;
  }

  /**
   * Retrieves the associated PhantomCore child with the given key.
   *
   * If no child is found with the given key, it will not return anything.
   */
  getChildWithKey(key: PhantomCollectionChildKey = null): PhantomCore | void {
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
      if (metadata.key === key) {
        return phantomCoreInstance;
      }
    }
  }

  /**
   * Retrieves the associative keys used with added children.
   *
   * Note: This will skip children which do not have defined keys.
   */
  getKeys(): PhantomCollectionChildKey[] {
    const keys = [];

    for (const entry of this._childrenMetadata.values()) {
      if (entry.key) {
        keys.push(entry.key);
      }
    }

    return keys;
  }

  /**
   * Emits an event to all child instances.
   *
   * [one-to-many relationship]
   */
  broadcast(eventName: string, eventData: unknown): void {
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
  bindChildEventName(childEventName: string): void {
    this._childEventBridge.proxyCollectionEvent(childEventName);
  }

  /**
   * Removes an event name from each child which previously would emit out the
   * PhantomCollection when triggered.
   *
   * [many-to-one relationship]
   */
  unbindChildEventName(childEventName: string): void {
    this._childEventBridge.unproxyCollectionEvent(childEventName);
  }

  /**
   * Retrieves the event names which are mapped to every child which will emit
   * out the PhantomCollection when triggered.
   */
  getBoundChildEventNames(): (string | symbol)[] {
    return this._childEventBridge.getProxiedCollectionEventNames();
  }

  override async destroy(destroyHandler?: () => void): Promise<void> {
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
