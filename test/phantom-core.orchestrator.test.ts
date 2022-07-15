import test from "tape";
import PhantomCore, { globalLogger } from "../src";
import orchestrator, {
  UNSAFE_PhantomCoreOrchestrator,
} from "../src/PhantomCore/_PhantomCoreOrchestrator";

test("does not allow multiple instances of orchestrator", async t => {
  t.plan(1);

  const p = new PhantomCore();

  t.throws(
    () => {
      new UNSAFE_PhantomCoreOrchestrator();
    },
    Error,
    "orchestrator blocks subsequent instance creation"
  );

  await p.destroy();

  t.end();
});

test("does not allow adding duplicate PhantomCore instances", async t => {
  t.plan(1);

  const p = new PhantomCore();

  t.throws(() => {
    orchestrator.addInstance(p);
  });

  await p.destroy();

  t.end();
});

test("sets and retrieves global log levels", async t => {
  t.plan(10);

  const oLogLevel = orchestrator.getInitialGlobalLogLevel();

  t.equals(
    orchestrator.getHasGlobalLogLevelChanged(),
    false,
    "orchestrator reports log level has not changed"
  );

  t.equals(oLogLevel, 3, "determines original log level from orchestrator");
  t.equals(
    globalLogger.getLogLevel(),
    oLogLevel,
    "global logger log level matches orchestrator representation"
  );

  orchestrator.setGlobalLogLevel(1);
  t.equals(
    orchestrator.getHasGlobalLogLevelChanged(),
    true,
    "orchestrator reports log level has changed"
  );

  t.equals(
    orchestrator.getGlobalLogLevel(),
    1,
    "orchestrator changes global log level"
  );
  t.equals(
    globalLogger.getLogLevel(),
    1,
    "global logger reflects orchestrator global change"
  );

  globalLogger.setLogLevel(2);
  t.equals(
    orchestrator.getGlobalLogLevel(),
    2,
    "orchestrator captures log level change"
  );

  orchestrator.setGlobalLogLevel(oLogLevel);

  t.equals(
    orchestrator.getGlobalLogLevel(),
    oLogLevel,
    "orchestrator global log level is reset to original value"
  );
  t.equals(
    globalLogger.getLogLevel(),
    oLogLevel,
    "global logger log level is reset to original value"
  );
  t.equals(
    orchestrator.getHasGlobalLogLevelChanged(),
    false,
    "orchestrator reports log level has reset"
  );

  t.end();
});

test("sets and retrieves PhantomCore log level", async t => {
  t.plan(7);

  t.equals(
    orchestrator.getPhantomClassLogLevel("NonExistent"),
    globalLogger.getLogLevel(),
    "non-existent phantom class log level is treated as global log level"
  );

  class CustomLogLevelPhantomCore extends PhantomCore {}

  const p = new CustomLogLevelPhantomCore();

  t.equals(
    orchestrator.getPhantomClassLogLevel("CustomLogLevelPhantomCore"),
    orchestrator.getInitialGlobalLogLevel(),
    "new phantom class has initial global log level"
  );

  orchestrator.setPhantomClassLogLevel("CustomLogLevelPhantomCore", "debug");

  t.equals(
    orchestrator.getPhantomClassLogLevel("CustomLogLevelPhantomCore"),
    4,
    "setting phantom class log level affects classes"
  );

  t.doesNotEqual(
    orchestrator.getGlobalLogLevel(),
    4,
    "setting phantom class log level does not affect global log level"
  );

  t.equals(
    orchestrator.getTotalPhantomInstancesWithClassName(
      "CustomLogLevelPhantomCore"
    ),
    1,
    "orchestrator reports one custom log level instance before destruct"
  );

  await p.destroy();

  t.equals(
    orchestrator.getTotalPhantomInstancesWithClassName(
      "CustomLogLevelPhantomCore"
    ),
    0,
    "orchestrator reports zero custom log level instances before destruct"
  );

  t.equals(
    orchestrator.getPhantomClassLogLevel("CustomLogLevelPhantomCore"),
    4,
    "custom phantom class log level is retained after all existing instances are destructed"
  );

  t.end();
});
