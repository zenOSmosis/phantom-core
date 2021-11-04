const test = require("tape");
const PhantomCore = require("../../src");
const { eventConstantCheckingUtils } = PhantomCore;
const { checkEvents, extractEvents, compareExportedEvents } =
  eventConstantCheckingUtils;

// Validate event testing utility works as expected
test("test utility checker", t => {
  t.plan(8);

  // TODO: Add error type and description
  t.doesNotThrow(() => {
    checkEvents({
      EVT_A: "a",
      EVT_B: "b",
    });
  });

  // TODO: Add error type and description
  t.throws(() => {
    checkEvents({
      A: "a",
      B: "b",
    });
  });

  // TODO: Add error type and description
  t.throws(() => {
    checkEvents({
      EVT_READY: "ready",
      EVT_DESTROYED: "ready",
    });
  });

  const fakeEvents = extractEvents({
    FakeClass: class FakeClass {},
    A: "hello",
    EVT_FAKE_EVENT_A: "a",
    EVT_FAKE_EVENT_B: "b",
  });

  // TODO: Add error type and description
  t.deepEquals(fakeEvents, {
    EVT_FAKE_EVENT_A: "a",
    EVT_FAKE_EVENT_B: "b",
  });

  // TODO: Add error type and description
  t.throws(() => {
    compareExportedEvents(
      {
        EVT_FAKE_EVENT_A: "a",
        EVT_FAKE_EVENT_B: "b",
      },
      {
        EVT_FAKE_EVENT_A: "a",
      }
    );
  });

  // TODO: Add error type and description
  t.doesNotThrow(() => {
    compareExportedEvents(
      {
        EVT_FAKE_EVENT_A: "a",
        EVT_FAKE_EVENT_B: "b",
      },
      {
        EVT_FAKE_EVENT_A: "a",
      },
      {
        EVT_FAKE_EVENT_B: "b",
      }
    );
  });

  // TODO: Add error type and description
  t.doesNotThrow(() => {
    compareExportedEvents(
      {
        EVT_FAKE_EVENT_A: "a",
      },
      {
        EVT_FAKE_EVENT_A: "a",
        EVT_FAKE_EVENT_B: "b",
      }
    );
  });

  // TODO: Add error type and description
  t.throws(() => {
    compareExportedEvents(
      {
        EVT_FAKE_EVENT_A: "a",
        EVT_FAKE_EVENT_B: "b",
      },
      {
        EVT_FAKE_EVENT_A: "a",
        EVT_FAKE_EVENT_B: "b-override",
      }
    );
  });

  t.end();
});
