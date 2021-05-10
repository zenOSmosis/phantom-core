const PhantomCore = require("./PhantomCore");
const { EVT_UPDATED, EVT_DESTROYED } = PhantomCore;

/**
 * A PhantomCoreCollection is a grouped collection of unique PhantomCore
 * instances, useful for performing operations on the entire collection
 * at once.
 */
class PhantomCoreCollection extends PhantomCore {
  constructor(initialPhantomInstances = []) {
    if (!Array.isArray(initialPhantomInstances)) {
      throw new TypeError("initialPhantomInstances must be an array");
    }

    super();

    this._coreInstances = [];

    initialPhantomInstances.forEach(instance => this.addInstance(instance));
  }

  /**
   * Adds a PhantomCore instance to the collection.
   *
   * @param {PhantomCore} phantomCoreInstance
   * @return {void}
   */
  addInstance(phantomCoreInstance) {
    if (!PhantomCore.getIsInstance(phantomCoreInstance)) {
      throw new TypeError(
        "The phantomCoreInstance is not a PhantomCore instance"
      );
    }

    if (this.getIsSameInstance(phantomCoreInstance)) {
      throw new TypeError("A PhantomCoreCollection cannot be passed to itself");
    }

    if (phantomCoreInstance.getIsDestroyed()) {
      throw new TypeError("Cannot add a destroyed PhantomCore instance");
    }

    // Ensure instance isn't already part of the collection
    for (const instance of this._coreInstances) {
      if (instance.getIsSameInstance(phantomCoreInstance)) {
        throw new RangeError(
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

    this.emit(EVT_UPDATED);
  }

  /**
   * Removes a PhantomCore instance from the collection.
   *
   * @param {PhantomCore} phantomCoreInstance
   */
  removeInstance(phantomCoreInstance) {
    // Find mapped instance
    const mapInstance = this._coreInstances.find(
      ({ phantomCoreInstance: instance }) =>
        instance.getIsSameInstance(phantomCoreInstance)
    );

    if (mapInstance) {
      if (!mapInstance.destroyListener) {
        this.log.warn(
          "Could not locate destroyListener for mapInstance",
          mapInstance
        );
      } else {
        // Remove destroy handler from instance
        phantomCoreInstance.off(EVT_DESTROYED, mapInstance.destroyListener);
      }

      // Remove mapped instance
      this._coreInstances = this._coreInstances.filter(
        ({ phantomCoreInstance: instance }) =>
          !instance.getIsSameInstance(phantomCoreInstance)
      );
    }

    this.emit(EVT_UPDATED);
  }

  /**
   * @return {PhantomCore[]}
   */
  getInstances() {
    return Object.values(this._coreInstances).map(
      ({ phantomCoreInstance }) => phantomCoreInstance
    );
  }

  /**
   * @return {Promise<void>}
   */
  async destroy() {
    // Empty out the collection
    for (const phantomCoreInstance of this.getInstances()) {
      this.removeInstance(phantomCoreInstance);
    }

    await super.destroy();
  }
}

module.exports = PhantomCoreCollection;
module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
