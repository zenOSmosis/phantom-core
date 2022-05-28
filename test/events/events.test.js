import test from "tape";
import PhantomCore, {
  ArbitraryPhantomWrapper,
  PhantomCollection,
  PhantomState,
  PhantomSerializableState,
  PhantomServiceCore,
  PhantomServiceManager,
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
  EVT_NO_INIT_WARN,
} from "../../src";

import { compareExportedEvents } from "../../src/utils/testing-utils/eventConstantCheckingUtils";

test("PhantomCore events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(PhantomCore, {
      EVT_READY,
      EVT_UPDATE,
      EVT_BEFORE_DESTROY,
      EVT_DESTROY_STACK_TIME_OUT,
      EVT_DESTROY,
      EVT_NO_INIT_WARN,
    });
  }, "PhantomCore exports expected events");

  t.end();
});

test("ArbitraryPhantomWrapper events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(PhantomCore, ArbitraryPhantomWrapper);
  }, "ArbitraryPhantomWrapper exports expected events");

  t.end();
});

test("PhantomCollection events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(PhantomCore, PhantomCollection);
  }, "PhantomCollection exports expected events");

  t.end();
});

test("PhantomState events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(PhantomCore, PhantomState);
  }, "PhantomState exports expected events");

  t.end();
});

test("PhantomSerializableState events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(PhantomState, PhantomSerializableState);
  }, "PhantomSerializableState exports expected events");

  t.end();
});

test("PhantomServiceCore events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(PhantomState, PhantomServiceCore);
  }, "PhantomServiceCore exports expected events");

  t.end();
});

test("PhantomServiceManager events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(PhantomCollection, PhantomServiceManager);
  }, "PhantomServiceManager exports expected events");

  t.end();
});
