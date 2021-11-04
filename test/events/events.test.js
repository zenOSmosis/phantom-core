const test = require("tape");
const PhantomCore = require("../../src");
const {
  PhantomCollection,
  PhantomState,
  PhantomServiceCore,
  PhantomServiceManager,
  EVT_READY,
  EVT_UPDATED,
  EVT_DESTROYED,
  EVT_NO_INIT_WARN,
} = PhantomCore;
const {
  checkEvents,
  extractEvents,
  compareExportedEvents,
} = require("../../src/utils/testing-utils/eventConstantCheckingUtils");

test("phantom-core events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(PhantomCore, {
      EVT_READY,
      EVT_UPDATED,
      EVT_DESTROYED,
      EVT_NO_INIT_WARN,
    });
  }, "phantom-core exports expected events");

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
