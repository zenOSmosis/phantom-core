const test = require("tape-async");
const PhantomCore = require("../src");
const PhantomCoreCollection = require("../src/PhantomCoreCollection");
const { EVT_READY, EVT_UPDATED, EVT_DESTROYED } = PhantomCore;

test("PhantomCoreCollection handling", async t => {
  t.plan(9);

  class ExtendedPhantomCore extends PhantomCore {}

  const extendedCore = new ExtendedPhantomCore();

  const collection = new PhantomCoreCollection([extendedCore]);

  t.equals(
    collection.getInstances().length,
    1,
    "initial passed instance registers as an instance"
  );

  t.throws(() => {
    collection.addInstance(collection);
  }, "prevents collection from being added to itself");

  t.throws(() => {
    collection.addInstance(extendedCore);
  }, "prevents previously added instance from being re-added");

  await extendedCore.destroy();

  t.equals(
    collection.getInstances().length,
    0,
    "de-increments instance length when instance destructs"
  );

  t.throws(
    () => collection.addInstance(extendedCore),
    "throws when trying to add a destructed instance"
  );

  const ec2 = new ExtendedPhantomCore();
  const lenEC2InitialEvents = ec2.listenerCount();

  await Promise.all([
    new Promise(resolve => {
      collection.once(EVT_UPDATED, () => {
        t.ok(true, "emits EVT_UPDATED when instance is added to collection");

        resolve();
      });
    }),

    collection.addInstance(ec2),
  ]);

  t.equals(
    ec2.listenerCount(EVT_DESTROYED),
    lenEC2InitialEvents + 1,
    "adds EVT_DESTROYED handler to instance when added to collection"
  );

  await Promise.all([
    new Promise(resolve => {
      collection.once(EVT_UPDATED, () => {
        t.ok(
          true,
          "emits EVT_UPDATED when instance is removed from collection"
        );

        resolve();
      });
    }),

    collection.removeInstance(ec2),
  ]);

  t.equals(
    ec2.listenerCount(EVT_DESTROYED),
    lenEC2InitialEvents,
    "removed EVT_DESTROYED handler from instance when removed from collection"
  );

  t.end();
});
