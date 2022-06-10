import test from "tape";
import PhantomCore, { globalLogger } from "../src";
import orchestrator, {
  PhantomCoreOrchestrator,
} from "../src/PhantomCore/_PhantomCoreOrchestrator";

test("does not allow multiple instances of orchestrator", async t => {
  t.plan(1);

  const p = new PhantomCore();

  t.throws(() => {
    new PhantomCoreOrchestrator();
  });

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

  globalLogger.setLogLevel(2, "global logger log level is changed directly");
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
