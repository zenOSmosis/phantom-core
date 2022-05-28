import PhantomCoreUnwatched, {
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
} from "./PhantomCore.unwatched";
import phantomWatcherProviderSingleton from "../PhantomWatcher/_PhantomWatcherProviderSingleton";

export {
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
};

// TODO: [3.0.0] Document
export default class PhantomCore extends PhantomCoreUnwatched {
  constructor(...args: any[]) {
    super(...args);

    // Note: PhantomWatcher will automatically handle instance de-registration
    phantomWatcherProviderSingleton.addInstance(this);
  }
}
