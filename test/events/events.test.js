const test = require("tape");
const PhantomCore = require("../../dist");
const {
  ArbitraryPhantomWrapper,
  PhantomCollection,
  PhantomState,
  PhantomSerializableState,
  PhantomServiceCore,
  PhantomServiceManager,
  EVT_READY,
  EVT_UPDATED,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIMED_OUT,
  EVT_DESTROYED,
  EVT_NO_INIT_WARN,
  eventConstantCheckingUtils,
} = PhantomCore;
const { compareExportedEvents } = eventConstantCheckingUtils;

test("PhantomCore events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(PhantomCore, {
      EVT_READY,
      EVT_UPDATED,
      EVT_BEFORE_DESTROY,
      EVT_DESTROY_STACK_TIMED_OUT,
      EVT_DESTROYED,
      EVT_NO_INIT_WARN,
    });
  }, "PhantomCore exports expected events");

  t.end();
});

test("ArbitraryPhantomWrapperr events", t => {
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
