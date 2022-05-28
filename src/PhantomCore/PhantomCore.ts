import PhantomCoreUnwatched, {
  EVT_NO_INIT_WARN,
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
} from "./PhantomCore.unwatched";
import _PhantomWatcherProvider from "../PhantomWatcher/_PhantomWatcherProvider";

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

    _PhantomWatcherProvider.addInstance(this);
  }
}
