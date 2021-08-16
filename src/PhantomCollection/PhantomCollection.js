const PhantomCore = require("../PhantomCore");
const { EVT_UPDATED, EVT_DESTROYED } = PhantomCore;

// TODO: Document
// @export
const EVT_CHILD_INSTANCE_ADDED = "child-instance-added";
// @export
const EVT_CHILD_INSTANCE_REMOVED = "child-instance-removed";

/**
 * A PhantomCollection contains an array of unique PhantomCore instances
 * which are bound as child instances.
 *
 * TODO: Reword: ... where EVT_UPDATED from each child
 * instance is emit out the main instance, and each child instance is
 * destructed when the main instance is destructed.
 */
class PhantomCollection extends PhantomCore {
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
     * An array of objects with PhantomCore information as well as destroy
     * listener for each.
     *
     * IMPORTANT: Use this.getInstances() instead of iterating on this variable
     * directly.
     *
     * @type {Object{phantomCoreInstance: PhantomCore, destroyListener: function}[]}
     */
    this._coreInstances = [];

    // TODO: Document
    const EventBridge = require("./EventBridge");

    // TODO: Document
    this._eventBridge = new EventBridge(this);

    // Add all initial instances
    initialPhantomInstances.forEach(instance => this.addInstance(instance));
  }

  /**
   * @return {Promise<void>}
   */
  async destroy() {
    // Empty out the collection
    for (const phantomCoreInstance of this.getInstances()) {
      this.removeInstance(phantomCoreInstance);
    }

    await this._eventBridge.destroy();

    await super.destroy();
  }

  // TODO: [ex. scenario] Child A emits EVT_AUDIO_LEVEL_TICK; pipe it through here

  /**
   * Adds a PhantomCore instance to the collection.
   *
   * @param {PhantomCore} phantomCoreInstance
   * @throws TypeError
   * @throws ReferenceError
   * @return {void}
   */
  addInstance(phantomCoreInstance) {
    if (!PhantomCore.getIsInstance(phantomCoreInstance)) {
      throw new TypeError(
        "The phantomCoreInstance is not a PhantomCore instance"
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
    for (const instance of this.getInstances()) {
      if (instance.getIsSameInstance(phantomCoreInstance)) {
        throw new ReferenceError(
          "The PhantomCore instance is already a part of the collection"
        );
      }
    }

    // Called when the collection instance is destroyed before the collection
    const destroyListener = () => this.removeInstance(phantomCoreInstance);

    this._coreInstances.push({
      phantomCoreInstance,
      destroyListener,
    });

    phantomCoreInstance.once(EVT_DESTROYED, destroyListener);

    this.emit(EVT_CHILD_INSTANCE_ADDED, phantomCoreInstance);
    this.emit(EVT_UPDATED);
  }

  /**
   * Removes a PhantomCore instance from the collection.
   *
   * @param {PhantomCore} phantomCoreInstance
   * @return {void}
   */
  removeInstance(phantomCoreInstance) {
    this._coreInstances = this._coreInstances.filter(mapInstance => {
      const instance = mapInstance.phantomCoreInstance;

      if (!phantomCoreInstance.getIsSameInstance(instance)) {
        return true;
      } else {
        if (!mapInstance.destroyListener) {
          this.log.warn(
            "Could not locate destroyListener for mapInstance",
            mapInstance
          );
        } else {
          // Remove destroy handler from instance
          phantomCoreInstance.off(EVT_DESTROYED, mapInstance.destroyListener);
        }

        return false;
      }
    });

    this.emit(EVT_CHILD_INSTANCE_REMOVED, phantomCoreInstance);
    this.emit(EVT_UPDATED);
  }

  /**
   * Emits an event to all child instances.
   *
   * @param {string} eventName
   * @param {any} eventData
   */
  broadcast(eventName, eventData) {
    for (const instance of this.getInstances()) {
      instance.emit(eventName, eventData);
    }
  }

  /**
   * @return {PhantomCore[]}
   */
  getInstances() {
    return Object.values(this._coreInstances).map(
      ({ phantomCoreInstance }) => phantomCoreInstance
    );
  }
}

module.exports = PhantomCollection;

module.exports.EVT_CHILD_INSTANCE_ADDED = EVT_CHILD_INSTANCE_ADDED;
module.exports.EVT_CHILD_INSTANCE_REMOVED = EVT_CHILD_INSTANCE_REMOVED;

module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
