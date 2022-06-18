import test from "tape";
import {
  PhantomCore,
  PhantomWatcher,
  EVT_UPDATE,
  EVT_PHANTOM_WATCHER_LOG_MISS,
} from "../src";

// TODO: [3.0.0] Build out
test("phantom watcher setup and cleanup", async t => {
  t.plan(3);

  const watcher = new PhantomWatcher();

  const n = watcher.getPhantomClassNames().length;

  // Avoid name conflicts with other PhantomCore instances
  class PhantomCore_WatcherSetup extends PhantomCore {}

  const phantom = new PhantomCore_WatcherSetup();

  t.equals(
    watcher.getPhantomClassNames().length,
    n,
    "does not initially contain watched node class name"
  );

  await new Promise(resolve => watcher.once(EVT_UPDATE, resolve));

  t.equals(
    watcher.getPhantomClassNames().length,
    n + 1,
    "watched node is added to unique class names after update"
  );

  await phantom.destroy();

  t.equals(
    watcher.getPhantomClassNames().length,
    n,
    "watched node is remove from unique class names after destruct "
  );

  await watcher.destroy();

  t.end();
});

// TODO: [3.0.0] Build out
test("multiple watchers", async t => {
  t.plan(7);

  const watcher1 = new PhantomWatcher();
  const watcher2 = new PhantomWatcher();

  const n = watcher1.getTotalPhantomInstances();

  t.equals(
    watcher1.getTotalPhantomInstances(),
    n,
    "watcher1 contains n phantom class instances"
  );
  t.equals(watcher2.getTotalPhantomInstances(), n),
    "watcher2 container same n phantom class instances";

  const phantom = new PhantomCore();

  t.equals(watcher1.getTotalPhantomInstances(), n + 1);
  t.equals(watcher2.getTotalPhantomInstances(), n + 1);

  await phantom.destroy();

  t.equals(watcher1.getTotalPhantomInstances(), n);
  t.equals(watcher2.getTotalPhantomInstances(), n);

  await watcher1.destroy();

  t.equals(watcher2.getTotalPhantomInstances(), n - 1);

  t.end();
});

test("phantom log miss with title update", async t => {
  t.plan(5);

  const FIRST_TITLE = "first-test-title";
  const SECOND_TITLE = "second-test-title";

  class LogMissPhantomCore extends PhantomCore {}

  const phantom = new LogMissPhantomCore({
    title: FIRST_TITLE,
  });

  const watcher = new PhantomWatcher();

  watcher.resetGlobalLogLevel();

  t.deepEquals(
    watcher.getPhantomClassLogMissCounts("LogMissPhantomCore"),
    [0, 0, 0, 0, 0]
  );

  await Promise.all([
    new Promise(resolve => {
      watcher.on(EVT_PHANTOM_WATCHER_LOG_MISS, function handleLogMiss(data) {
        if (data.logLevel === 5 && data.title === FIRST_TITLE) {
          t.deepEquals(
            watcher.getPhantomClassLogMissCounts("LogMissPhantomCore"),
            [0, 0, 0, 0, 1],
            "first log miss is accounted for"
          );

          t.deepEquals(
            data,
            {
              phantomClassName: "LogMissPhantomCore",
              title: FIRST_TITLE,
              logLevel: 5,
            },
            "initial phantom log miss is captured"
          );

          watcher.off(EVT_PHANTOM_WATCHER_LOG_MISS, handleLogMiss);

          phantom.setTitle(SECOND_TITLE);
          phantom.log.trace("hello");

          resolve();
        }
      });
    }),

    new Promise(resolve => {
      watcher.on(EVT_PHANTOM_WATCHER_LOG_MISS, function handleLogMiss(data) {
        if (data.logLevel === 5 && data.title === SECOND_TITLE) {
          t.deepEquals(
            watcher.getPhantomClassLogMissCounts("LogMissPhantomCore"),
            [0, 0, 0, 0, 2],
            "second log miss is accounted for"
          );

          t.deepEquals(
            data,
            {
              phantomClassName: "LogMissPhantomCore",
              title: SECOND_TITLE,
              logLevel: 5,
            },
            "secondary phantom log miss after title update is captured"
          );

          watcher.off(EVT_PHANTOM_WATCHER_LOG_MISS, handleLogMiss);

          resolve();
        }
      });
    }),

    phantom.log.trace("test"),
  ]);

  await phantom.destroy();
  await watcher.destroy();

  t.end();
});

test("per class name instance count", async t => {
  t.plan(6);

  class P1 extends PhantomCore {}
  class P2 extends PhantomCore {}

  const watcher = new PhantomWatcher();

  t.equals(
    watcher.getTotalPhantomInstancesWithClassName("P1"),
    0,
    "Returns 0 value if no instances are instantiated"
  );

  const p1_1 = new P1();

  t.equals(
    watcher.getTotalPhantomInstancesWithClassName("P1"),
    1,
    "Returns 1 value after first instance is instantiated"
  );

  t.equals(
    watcher.getTotalPhantomInstancesWithClassName("P2"),
    0,
    "Returns 0 value before P2 is instantiated the first time"
  );

  const p2_1 = new P2();
  const p2_2 = new P2();
  const p2_3 = new P2();
  const p2_4 = new P2();

  t.equals(
    watcher.getTotalPhantomInstancesWithClassName("P2"),
    4,
    "Returns 4 after P2 is instantiated four times"
  );

  await p2_3.destroy();

  t.equals(
    watcher.getTotalPhantomInstancesWithClassName("P2"),
    3,
    "Returns 3 after one P2 instance is destructed"
  );

  await p1_1.destroy();

  t.equals(
    watcher.getTotalPhantomInstancesWithClassName("P1"),
    0,
    "Returns 0 value after first instance is destructed"
  );

  await watcher.destroy();

  await p2_1.destroy();
  await p2_2.destroy();
  await p2_4.destroy();

  t.end();
});