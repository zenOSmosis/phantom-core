const test = require("tape-async");
const PhantomCore = require("../src");
const EventEmitter = require("events");
const PhantomCoreCollection = require("../src/PhantomCoreCollection");
const { EVT_UPDATED, EVT_DESTROYED } = PhantomCore;

test("PhantomCoreCollection handling", async t => {
  t.plan(17);

  t.throws(
    () => {
      new PhantomCoreCollection("some-string");
    },
    TypeError,
    "instantiating with string throws TypeError"
  );

  t.throws(
    () => {
      new PhantomCoreCollection({ a: 123 });
    },
    TypeError,
    "instantiating with object throws TypeError"
  );

  t.throws(
    () => {
      new PhantomCoreCollection([new PhantomCore(), new EventEmitter()]);
    },
    TypeError,
    "cannot instantiate with non-PhantomCore class instances"
  );

  class PhantomCoreTestClass extends PhantomCore {}

  const extendedCore = new PhantomCoreTestClass();

  const collection = new PhantomCoreCollection([extendedCore]);

  t.throws(
    () => {
      collection.addInstance(extendedCore);
    },
    ReferenceError,
    "prevents previously added instance from being re-added"
  );

  t.equals(
    collection.getInstances().length,
    1,
    "initial passed instance registers as an instance"
  );

  t.ok(
    PhantomCore.getIsInstance(collection.getInstances()[0]),
    "getInstances() retrieves PhantomCore types"
  );

  t.throws(
    () => {
      collection.addInstance(new EventEmitter());
    },
    TypeError,
    "cannot add non-PhantomCore class instance"
  );

  t.throws(
    () => {
      collection.addInstance(collection);
    },
    ReferenceError,
    "prevents collection from being added to itself"
  );

  await extendedCore.destroy();

  t.equals(
    collection.getInstances().length,
    0,
    "de-increments instance length when instance destructs"
  );

  t.throws(
    () => collection.addInstance(extendedCore),
    ReferenceError,
    "throws when trying to add a destructed instance"
  );

  const ec2 = new PhantomCoreTestClass();
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

  (() => {
    const coll1 = new PhantomCoreCollection();
    const coll2 = new PhantomCoreCollection([coll1]);

    t.throws(
      () => coll2.addInstance(coll1),
      ReferenceError,
      "ReferenceError is raised when coll1 is tried to be re-added to coll2"
    );

    t.ok(
      coll2.getInstances()[0].getIsSameInstance(coll1),
      "coll1 can be added to coll2"
    );

    coll2.removeInstance(coll1);

    t.equals(coll2.getInstances().length, 0, "coll2 can remove coll1");
  })();

  t.equals(
    ec2.listenerCount(EVT_DESTROYED),
    lenEC2InitialEvents,
    "removes EVT_DESTROYED handler from instance when removed from collection"
  );

  t.end();
});
