import test from "tape";
import {
  PhantomCore,
  PhantomWatcher,
  EVT_PHANTOM_WATCHER_LOG_MISS,
} from "../src";

// TODO: [3.0.0] Build out
test("phantom watcher setup and cleanup", async t => {
  // TODO: Implement plan

  const watcher = new PhantomWatcher();

  const n = watcher.getPhantomClassNames().length;

  t.equals(watcher.getPhantomClassNames().length, n);

  // Avoid name conflicts with other PhantomCore instances
  class PhantomCore_WatcherSetup extends PhantomCore {}

  const phantom = new PhantomCore_WatcherSetup();

  t.equals(watcher.getPhantomClassNames().length, n + 1);

  await phantom.destroy();

  t.equals(watcher.getPhantomClassNames().length, n);

  await watcher.destroy();

  t.end();
});

// TODO: [3.0.0] Build out
test("multiple watchers", async t => {
  // TODO: Implement plan

  const watcher1 = new PhantomWatcher();
  const watcher2 = new PhantomWatcher();

  const n = watcher1.getTotalPhantomInstances();

  t.equals(watcher1.getTotalPhantomInstances(), n);
  t.equals(watcher2.getTotalPhantomInstances(), n);

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
  t.plan(2);

  const FIRST_TITLE = "first-test-title";
  const SECOND_TITLE = "second-test-title";

  class LogMissPhantomCore extends PhantomCore {}

  const phantom = new LogMissPhantomCore({
    title: FIRST_TITLE,
  });

  const watcher = new PhantomWatcher();

  watcher.resetGlobalLogLevel();

  await Promise.all([
    new Promise(resolve => {
      watcher.on(EVT_PHANTOM_WATCHER_LOG_MISS, function handleLogMiss(data) {
        if (data.logLevel === 5 && data.title === FIRST_TITLE) {
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
