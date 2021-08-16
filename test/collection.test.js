const test = require("tape-async");
const PhantomCore = require("../src");
const { EVT_UPDATED, EVT_DESTROYED } = PhantomCore;
const EventEmitter = require("events");
const PhantomCollection = require("../src/PhantomCollection");
const {
  EVT_CHILD_INSTANCE_ADDED,
  EVT_CHILD_INSTANCE_REMOVED,
  KEY_META_CHILD_DESC_INSTANCE,
  KEY_META_CHILD_DESC_PROXY_EVENT_HANDLERS,
  KEY_META_CHILD_DESTROY_LISTENER,
} = PhantomCollection;

const _ChildEventBridge = require("../src/PhantomCollection/ChildEventBridge");

test("PhantomCollection add / remove child; get children", async t => {
  t.plan(28);

  t.throws(
    () => {
      new PhantomCollection("some-string");
    },
    TypeError,
    "instantiating with string throws TypeError"
  );

  t.throws(
    () => {
      new PhantomCollection({ a: 123 });
    },
    TypeError,
    "instantiating with object throws TypeError"
  );

  t.throws(
    () => {
      new PhantomCollection([new PhantomCore(), new EventEmitter()]);
    },
    TypeError,
    "cannot instantiate with non-PhantomCore class instances"
  );

  class PhantomCoreTestClass extends PhantomCore {}

  const extendedCore = new PhantomCoreTestClass();

  const collection = new PhantomCollection([extendedCore]);

  t.throws(
    () => {
      collection.addChild(extendedCore);
    },
    ReferenceError,
    "prevents previously added instance from being re-added"
  );

  t.equals(
    collection.getChildren().length,
    1,
    "initial passed instance registers as a child instance"
  );

  t.ok(
    PhantomCore.getIsInstance(collection.getChildren()[0]),
    "getChildren() retrieves PhantomCore types"
  );

  t.throws(
    () => {
      collection.addChild(new EventEmitter());
    },
    TypeError,
    "cannot add non-PhantomCore class instance"
  );

  t.throws(
    () => {
      collection.addChild(collection);
    },
    ReferenceError,
    "prevents collection from being added to itself"
  );

  await extendedCore.destroy();

  t.equals(
    collection.getChildren().length,
    0,
    "de-increments instance length when instance destructs"
  );

  t.throws(
    () => collection.addChild(extendedCore),
    ReferenceError,
    "throws when trying to add a destructed instance"
  );

  const ec2 = new PhantomCoreTestClass();
  const lenEC2InitialEvents = ec2.listenerCount();

  await Promise.all([
    new Promise(resolve => {
      collection.once(EVT_UPDATED, () => {
        t.ok(true, "emits EVT_UPDATED when instance is added to collection");

        t.ok(
          collection.getChildren().includes(ec2),
          "getChildren() includes added child instance"
        );

        resolve();
      });
    }),

    new Promise(resolve => {
      collection.once(EVT_CHILD_INSTANCE_ADDED, childInstance => {
        t.ok(
          Object.is(childInstance, ec2),
          "emits EVT_CHILD_INSTANCE_ADDED when instance is added to collection"
        );

        t.ok(
          collection.getChildren().includes(ec2),
          "getChildren() includes added child instance"
        );

        const ec2MetaDescription = collection.getChildMetaDescription(ec2);

        t.equals(
          typeof ec2MetaDescription,
          "object",
          "child meta description is an object"
        );

        t.ok(
          Object.keys(ec2MetaDescription).includes(
            KEY_META_CHILD_DESC_INSTANCE
          ) &&
            Object.keys(ec2MetaDescription).includes(
              KEY_META_CHILD_DESC_PROXY_EVENT_HANDLERS
            ) &&
            Object.keys(ec2MetaDescription).includes(
              KEY_META_CHILD_DESTROY_LISTENER
            ),
          "all expected meta child keys are present"
        );

        t.ok(
          Object.is(ec2MetaDescription[KEY_META_CHILD_DESC_INSTANCE], ec2),
          "child meta description phantom core instance matches child instance"
        );

        resolve();
      });
    }),

    collection.addChild(ec2),
  ]);

  await Promise.all([
    new Promise(resolve => {
      collection.once(EVT_UPDATED, () => {
        t.ok(
          true,
          "emits EVT_UPDATED when instance is removed from collection"
        );

        t.ok(
          !collection.getChildren().includes(ec2),
          "getChildren() does not include removed child instance"
        );

        resolve();
      });
    }),

    new Promise(resolve => {
      collection.once(EVT_CHILD_INSTANCE_REMOVED, childInstance => {
        t.ok(
          Object.is(childInstance, ec2),
          "emits EVT_CHILD_INSTANCE_REMOVED when instance is removed from collection"
        );

        t.ok(
          !collection.getChildren().includes(ec2),
          "getChildren() does not include removed child instance"
        );

        resolve();
      });
    }),

    collection.removeChild(ec2),
  ]);

  t.doesNotThrow(() => {
    collection.addChild(ec2);
  }, "child can be re-added to collection");

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

    collection.removeChild(ec2),
  ]);

  (() => {
    const coll1 = new PhantomCollection();
    const coll2 = new PhantomCollection([coll1]);

    t.ok(
      coll2.getChildren()[0].getIsSameInstance(coll1),
      "contain child collection"
    );

    coll2.removeChild(coll1);
    t.equals(coll2.getChildren().length, 0, "coll2 can remove coll1");

    const sharedPhantom = new PhantomCore();

    t.doesNotThrow(() => {
      coll1.addChild(sharedPhantom);
      coll2.addChild(sharedPhantom);
    }, "does not throw error when shared phantom added to two collections");
  })();

  t.equals(
    ec2.listenerCount(EVT_DESTROYED),
    lenEC2InitialEvents,
    "removes EVT_DESTROYED handler from instance when removed from collection"
  );

  t.end();
});

test("PhantomCollection broadcasting / post-destruct child retention", async t => {
  t.plan(4);

  const phantom1 = new PhantomCore();
  const phantom2 = new PhantomCore();

  const collection = new PhantomCollection([phantom1, phantom2]);

  const expectedEventMessage = "hello world. it works.";

  await Promise.all([
    new Promise(resolve => {
      phantom1.once(EVT_UPDATED, message => {
        t.equals(
          message,
          expectedEventMessage,
          "phantom1 received correct broadcast message"
        );

        resolve();
      });
    }),

    new Promise(resolve => {
      phantom2.once(EVT_UPDATED, message => {
        t.equals(
          message,
          expectedEventMessage,
          "phantom2 received correct broadcast message"
        );

        resolve();
      });
    }),

    new Promise(resolve => {
      collection.broadcast(EVT_UPDATED, expectedEventMessage);

      resolve();
    }),
  ]);

  try {
    await collection.destroy();

    t.ok(
      !phantom1.getIsDestroyed(),
      "phantom1 is not destroyed after collection is"
    );
    t.ok(
      !phantom2.getIsDestroyed(),
      "phantom2 is not destroyed after collection is"
    );
  } catch (err) {
    throw err;
  }

  t.end();
});

test("PhantomCollection ChildEventBridge", async t => {
  t.plan(1);

  t.throws(
    () => {
      new _ChildEventBridge(new PhantomCore());
    },
    TypeError,
    "throws TypeError when trying to add non-PhantomCollection instance"
  );

  /*
  const collection = new PhantomCollection();
  const child1 = new PhantomCore();
  const child2 = new PhantomCore();

  const eventBridge = new _ChildEventBridge(collection);

  await Promise.all([
    new Promise(resolve => {
      eventBridge.once()
    }),

    new Promise(resolve => {
      collection.addChild(child1)
    })
  ])
  */

  // TODO: Add additional ChildEventBridge tests

  t.end();
});
