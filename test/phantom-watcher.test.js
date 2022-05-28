import test from "tape";
import { PhantomCore, PhantomWatcher } from "../src";

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
