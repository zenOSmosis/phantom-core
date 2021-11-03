const test = require("tape");
const PhantomCore = require("../src");
const { EVT_READY, EVT_DESTROYED } = PhantomCore;
const {
  checkEvents,
  extractEvents,
  compareExportedEvents,
} = require("../src/utils/testing-utils/eventConstantCheckingUtils");

// Validate event testing utility works as expected
test("test utility checker", t => {
  // t.plan()

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

// TODO: Rename test
test("proto event checking", t => {
  // t.plan()

  t.doesNotThrow(() => {
    checkEvents({
      EVT_READY,
      EVT_DESTROYED,
    });
  });

  t.end();
});

// throw new Error("TODO: Implement");

// const test = require("tape");
// const PhantomCore = require("../src");
