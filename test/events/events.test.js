const test = require("tape");
const PhantomCore = require("../../src");
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

// TODO: Refactor these tests once event deps are included in PhantomCore
// @see https://github.com/zenOSmosis/phantom-core/issues/93

test("phantom-core events", t => {
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
  }, "phantom-core exports expected events");

  t.end();
});

test("arbitrary-phantom-wrapper events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(PhantomCore, ArbitraryPhantomWrapper);
  }, "arbitrary-phantom-wrapper exports expected events");

  t.end();
});

test("phantom-collection events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(PhantomCore, PhantomCollection);
  }, "phantom-collection exports expected events");

  t.end();
});

test("phantom-state events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(PhantomCore, PhantomState);
  }, "phantom-state exports expected events");

  t.end();
});

test("phantom-serial-state events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(PhantomState, PhantomSerializableState);
  }, "phantom-state exports expected events");

  t.end();
});

test("phantom-service-core events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(PhantomState, PhantomServiceCore);
  }, "phantom-service-core exports expected events");

  t.end();
});

test("phantom-service-manager events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(PhantomCollection, PhantomServiceManager);
  }, "phantom-service-manager exports expected events");

  t.end();
});
