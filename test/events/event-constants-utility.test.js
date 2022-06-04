import test from "tape";
import {
  checkEvents,
  checkEventValue,
  extractEvents,
  compareExportedEvents,
} from "../../src";

test("ensures valid event values", t => {
  t.plan(9);

  t.doesNotThrow(() => {
    checkEventValue("test");
  }, "accepts lowercase event name");

  t.doesNotThrow(() => {
    checkEventValue("update-test");
  }, "accepts lowercase event name with hyphen");

  t.doesNotThrow(() => {
    checkEventValue("update-test-test");
  }, "accepts lowercase event name with multiple hyphens");

  t.throws(
    () => {
      checkEventValue("ending-hyphen-");
    },
    TypeError,
    "throws if trailing hyphen"
  );

  t.throws(
    () => {
      checkEventValue("-beginning-hyphen");
    },
    TypeError,
    "throws if leading hyphen"
  );

  t.throws(
    () => {
      checkEventValue("camelCase");
    },
    TypeError,
    "throws if camelCase"
  );

  t.throws(
    () => {
      checkEventValue("PascalCase");
    },
    TypeError,
    "throws if PascalCase"
  );

  t.throws(
    () => {
      checkEventValue(" padded ");
    },
    TypeError,
    'throws if " padded "'
  );

  t.throws(
    () => {
      checkEventValue("UPPERCASE-TEST-EVENT");
    },
    TypeError,
    "throws if uppercase"
  );

  t.end();
});

// Validate event testing utility works as expected
test("test utility checker", t => {
  t.plan(17);

  t.throws(
    () => {
      checkEvents({});
    },
    ReferenceError,
    "throws if checked events are empty"
  );

  t.throws(
    () => {
      extractEvents({});
    },
    ReferenceError,
    "throws if extracted events are empty"
  );

  t.throws(() => {
    checkEvents({
      evt_a: "hello",
    });
  }, "throws when no upper-case event is given");

  t.doesNotThrow(() => {
    checkEvents({
      EVT_A: Symbol("TEST"),
    });
  }, "does not throw if symbol event is passed");

  t.throws(() => {
    checkEvents({
      EVT_A: null,
    });
  }, "if null event is passed");

  t.throws(() => {
    checkEvents({
      EVT_A: undefined,
    });
  }, "if undefined event is passed");

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
      EVT_DESTROY: "ready",
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
