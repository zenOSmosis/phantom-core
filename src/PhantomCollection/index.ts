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
} from "./PhantomCollection";
import { PhantomCollectionChildKey } from "./types";
import PhantomCollectionChildEventBridge from "./PhantomCollection.ChildEventBridge";

export default PhantomCollection;
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
export type { PhantomCollectionChildKey };
export { PhantomCollectionChildEventBridge };
