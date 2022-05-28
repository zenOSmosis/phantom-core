import { EventEmitter } from "events";
import PhantomCore, { EVT_UPDATE } from "../PhantomCore/PhantomCore";

// TODO: [3.0.0] This should run as a singleton and never be destructed
// TODO: [3.0.0] Document
class _PhantomWatcherProvider extends EventEmitter {
  protected _instances: Set<PhantomCore> = new Set();
  protected _classNames: Set<string> = new Set();

  // TODO: [3.0.0] Document
  addInstance(phantom: PhantomCore) {
    phantom.registerCleanupHandler(() => this.removeInstance(phantom));

    this._instances.add(phantom);
    this._classNames.add(phantom.getClassName());

    this.emit(EVT_UPDATE);
  }

  // TODO: [3.0.0] Document
  removeInstance(phantom: PhantomCore) {
    this._instances.delete(phantom);
    const className = phantom.getClassName();

    const instancesWithClassName = [...this._instances].filter(
      pred => pred.getClassName() === className
    );
    if (!instancesWithClassName) {
      this._classNames.delete(className);
    }

    this.emit(EVT_UPDATE);
  }
}

export default new _PhantomWatcherProvider();
