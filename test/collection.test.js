const test = require("tape-async");
const PhantomCore = require("../src");
const { EVT_UPDATED, EVT_DESTROYED } = PhantomCore;
const EventEmitter = require("events");
const PhantomCollection = require("../src/PhantomCollection");
const {
  EVT_CHILD_INSTANCE_ADDED,
  EVT_CHILD_INSTANCE_REMOVED,
  KEY_META_CHILD_DESC_INSTANCE,
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
  t.plan(15);

  t.throws(
    () => {
      new _ChildEventBridge(new PhantomCore());
    },
    TypeError,
    "throws TypeError when trying to add non-PhantomCollection instance"
  );

  const collection = new PhantomCollection();
  const child1 = new PhantomCore();
  const child2 = new PhantomCore();
  const child3 = new PhantomCore();
  const child4 = new PhantomCore();

  collection.addChild(child1);
  collection.addChild(child2);
  collection.addChild(child3);
  collection.addChild(child4);

  t.deepEquals(
    collection.getChildEventNames(),
    [EVT_UPDATED],
    "collection includes EVT_UPDATED event by default"
  );

  collection.removeChildEventName(EVT_UPDATED);

  t.deepEquals(
    collection.getChildEventNames(),
    [],
    "collection has 0 mapped child events after removing EVT_UPDATED"
  );

  collection.addChildEventName(EVT_UPDATED);

  t.deepEquals(
    collection.getChildEventNames(),
    [EVT_UPDATED],
    "collection can add child event"
  );

  t.doesNotThrow(() => {
    collection.addChildEventName(EVT_UPDATED);
  }, "collection does not throw when trying to add duplicate event (silently ignores)");

  t.deepEquals(
    collection.getChildEventNames(),
    [EVT_UPDATED],
    "collection does not contain duplicate added event"
  );

  // Test event proxying from child to collection
  await (async () => {
    const iChildren = [child1, child2, child3, child4];
    for (const idx in iChildren) {
      const child = iChildren[idx];

      await Promise.all([
        new Promise(resolve => {
          collection.once(EVT_UPDATED, message => {
            t.equals(
              message,
              "some-test-data",
              `collection receives EVT_UPDATED emit from child ${idx}`
            );

            resolve();
          });
        }),

        new Promise(resolve => {
          child.emit(EVT_UPDATED, "some-test-data");

          resolve();
        }),
      ]);
    }
  })();

  // Test that removing child event names no longer routes the event through
  // the collection
  await (async () => {
    collection.removeChildEventName(EVT_UPDATED);

    await Promise.all([
      new Promise(resolve => {
        const eventRejectHandler = message => {
          throw new Error("Should not get here");
        };

        collection.once(EVT_UPDATED, eventRejectHandler);

        setTimeout(() => {
          collection.off(EVT_UPDATED, eventRejectHandler);

          resolve();
        }, 500);
      }),

      new Promise(resolve => {
        child1.emit(EVT_UPDATED, "some-additional-test-data");

        resolve();
      }),
    ]);
  })();

  // Test destruct unbinding
  await (async () => {
    collection.addChildEventName(EVT_UPDATED);
    collection.addChildEventName("some-test");

    const coll2 = new PhantomCollection([child1, child2, child3, child4]);

    let prevTotalChildEvents = [child1, child2, child3, child4]
      .map(child => {
        return child.getTotalListenerCount();
      })
      .reduce((a, b) => a + b);

    t.equals(
      prevTotalChildEvents,
      20,
      "initial mapped child events before initial collection destruct is 20"
    );

    await collection.destroy();

    const nextTotalChildEvents = [child1, child2, child3, child4]
      .map(child => {
        return child.getTotalListenerCount();
      })
      .reduce((a, b) => a + b);

    t.ok(
      nextTotalChildEvents < prevTotalChildEvents,
      "total child listener count is reduced after collection destruct"
    );

    await coll2.destroy();

    const finalTotalChildEvents = [child1, child2, child3, child4]
      .map(child => {
        return child.getTotalListenerCount();
      })
      .reduce((a, b) => a + b);

    t.ok(
      finalTotalChildEvents < nextTotalChildEvents,
      "total child listener count is further reduced after second collection destruct"
    );
  })();

  (() => {
    const collection = new PhantomCollection();
    const child1 = new PhantomCore();
    // const child2 = new PhantomCore();

    class _TestChildEventBridge extends _ChildEventBridge {
      constructor(...args) {
        super(...args);

        this._self = this;
      }

      _handleChildInstanceAdded() {
        t.ok(
          Object.is(this._self, this),
          "_handleChildInstanceAdded is scoped to class"
        );
      }

      _handleChildInstanceRemoved() {
        t.ok(
          Object.is(this._self, this),
          "_handleChildInstanceRemoved is scoped to class"
        );
      }
    }

    // Test overridden EventBridge methods by instantiating test bridge an
    // adding the collection to it
    //
    // When children are added or removed, the alt bridge will run its own
    // lifecycle method hooks, in addition to the default bridge already
    // associated with the collection
    /* const altEventBridge = */ new _TestChildEventBridge(collection);

    collection.addChild(child1);
    collection.removeChild(child1);
  })();

  t.end();
});
