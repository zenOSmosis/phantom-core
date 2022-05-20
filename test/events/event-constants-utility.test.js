const test = require("tape");
const PhantomCore = require("../../dist");
const { eventConstantCheckingUtils } = PhantomCore;
const { checkEvents, extractEvents, compareExportedEvents } =
  eventConstantCheckingUtils;

// Validate event testing utility works as expected
test("test utility checker", t => {
  t.plan(13);

  t.throws(() => {
    checkEvents({
      evt_a: "hello",
    });
  }, "throws when no upper-case event is given");

  t.throws(() => {
    checkEvents({
      // FIXME: (jh) Add symbol support
      EVT_A: Symbol("TEST"),
    });
  }, "throws when non-string event is passed");

  t.doesNotThrow(() => {
    checkEvents({
      EVT_A: "a",
      EVT_B: "b",
    });
  }, "proper events pass");

  t.throws(() => {
    checkEvents({
      A: "a",
      B: "b",
    });
  }, "invalid event types throw");

  t.throws(() => {
    checkEvents({
      EVT_READY: "ready",
      EVT_DESTROYED: "ready",
    });
  }, "non-unique event values throw");

  const fakeEvents = extractEvents({
    FakeClass: class FakeClass {},
    A: "hello",
    EVT_FAKE_EVENT_A: "a",
    EVT_FAKE_EVENT_B: "b",
  });

  t.deepEquals(
    fakeEvents,
    {
      EVT_FAKE_EVENT_A: "a",
      EVT_FAKE_EVENT_B: "b",
    },
    "extracted events are okay"
  );

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
  }, "missing exported event throws");

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
  }, "excluded events work");

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
  }, "new events do not throw");

  t.doesNotThrow(() => {
    compareExportedEvents(
      {
        EVT_FAKE_EVENT_A: "a",
        NO_EVT: "c",
      },
      {
        EVT_FAKE_EVENT_A: "a",
        EVT_FAKE_EVENT_B: "b",
      }
    );
  }, "incorrect old event does not throw, as it is run through extraction mechanism");

  t.doesNotThrow(() => {
    compareExportedEvents(
      {
        EVT_FAKE_EVENT_A: "a",
      },
      {
        EVT_FAKE_EVENT_A: "a",
        EVT_FAKE_EVENT_B: "b",
        NO_EVT: "c",
      }
    );
  }, "incorrect new event does not throw, as it is run through extraction mechanism");

  t.doesNotThrow(() => {
    compareExportedEvents(
      {
        EVT_FAKE_EVENT_A: "a",
      },
      {
        EVT_FAKE_EVENT_A: "a",
        EVT_FAKE_EVENT_B: "b",
      },
      {
        NO_EVT: "c",
      }
    );
  }, "incorrect exclusion event does not throw, as it is not checked");

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
  }, "throws when constant event names do not match");

  t.end();
});
