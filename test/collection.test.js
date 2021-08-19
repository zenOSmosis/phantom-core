const test = require("tape-async");
const PhantomCore = require("../src");
const { EVT_UPDATED, EVT_DESTROYED } = PhantomCore;
const EventEmitter = require("events");
const PhantomCollection = require("../src/PhantomCollection");
const {
  EVT_CHILD_INSTANCE_ADDED,
  EVT_CHILD_INSTANCE_REMOVED,
  KEY_META_CHILD_DESC_INSTANCE,
  KEY_META_DESC_CHILD_KEY,
  KEY_META_CHILD_DESTROY_LISTENER,
} = PhantomCollection;

const _ChildEventBridge = require("../src/PhantomCollection/ChildEventBridge");

test("PhantomCollection add / remove child; get children", async t => {
  t.plan(33);

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

  t.equals(collection._lenChildren, 1, "protected _lenChildren equals 1");

  t.doesNotThrow(() => {
    collection.addChild(new PhantomCore(), "temp-child");
  }, 'collection adds new child with "test-remove" key');

  t.equals(
    collection._lenChildren,
    2,
    "protected _lenChildren equals 2 after temp child added"
  );

  t.doesNotThrow(() => {
    collection.removeChild(collection.getChildWithKey("temp-child"));
  }, 'collection removes child with "temp-child" key');

  t.equals(
    collection._lenChildren,
    1,
    "protected _lenChildren equals 1 after temp child removed"
  );

  t.doesNotThrow(() => {
    const prevLength = collection.getChildren().length;

    collection.addChild(extendedCore);

    const nextLength = collection.getChildren().length;

    if (prevLength !== nextLength) {
      throw new Error("Duplicate child was added");
    }
  }, "silently ignores duplicate child add attempt");

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
            Object.keys(ec2MetaDescription).includes(KEY_META_DESC_CHILD_KEY) &&
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
    collection.getBoundChildEventNames(),
    [EVT_UPDATED],
    "collection includes EVT_UPDATED event by default"
  );

  collection.unbindChildEventName(EVT_UPDATED);

  t.deepEquals(
    collection.getBoundChildEventNames(),
    [],
    "collection has 0 mapped child events after removing EVT_UPDATED"
  );

  collection.bindChildEventName(EVT_UPDATED);

  t.deepEquals(
    collection.getBoundChildEventNames(),
    [EVT_UPDATED],
    "collection can add child event"
  );

  t.doesNotThrow(() => {
    collection.bindChildEventName(EVT_UPDATED);
  }, "collection does not throw when trying to add duplicate event (silently ignores)");

  t.deepEquals(
    collection.getBoundChildEventNames(),
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
    collection.unbindChildEventName(EVT_UPDATED);

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
    collection.bindChildEventName(EVT_UPDATED);
    collection.bindChildEventName("some-test");

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

test("PhantomCollection key support", async t => {
  t.plan(8);

  const coll = new PhantomCollection();

  const tPhantom1 = new PhantomCore();
  coll.addChild(tPhantom1, "tPhantom1-test-key");
  t.ok(
    Object.is(tPhantom1, coll.getChildWithKey("tPhantom1-test-key")),
    "obtains child1 with associated key"
  );

  t.ok(coll.getChildren().length, 1, "detects one child after first child add");

  t.doesNotThrow(() => {
    coll.addChild(new PhantomCore(), "tPhantom1-test-key");
  }, "does not throw when trying to add another child with same test key");

  t.ok(
    coll.getChildren().length,
    1,
    "detects one child after duplicate key attempt"
  );

  const tPhantom2 = new PhantomCore();
  coll.addChild(tPhantom2, null);
  t.notOk(
    coll.getChildWithKey(null),
    "does not retrieve children with null keys"
  );

  const tPhantom3 = new PhantomCore();
  coll.addChild(tPhantom3, "tPhantom3-test-key");
  t.ok(
    Object.is(tPhantom3, coll.getChildWithKey("tPhantom3-test-key")),
    "obtains child3 with associated key"
  );
  t.ok(
    Object.is(tPhantom1, coll.getChildWithKey("tPhantom1-test-key")),
    "obtains child1 with associated key, again"
  );
  t.notOk(
    coll.getChildWithKey("tPhantom3-invalid-key"),
    "does not retrieve any child with invalid key"
  );

  t.end();
});

test("PhantomCollection coerced type support", async t => {
  t.plan(12);

  let _hasDuplicate = false;

  class _TestCoercedTypeCollection extends PhantomCollection {
    // Takes an object and converts it into another type before writing it to
    // super
    //
    // This type of scenario may be encountered often when dealing with objects
    // of one value needing to be stored as another
    addChild(obj, key = null) {
      if (this.getChildWithKey(key)) {
        t.ok(key !== null, "captures get child with key");

        this.emit("duplicate-key");

        _hasDuplicate = true;

        return;
      }

      const phantom = new PhantomCore();

      phantom.__testObj = obj;
      return super.addChild(phantom, key);
    }
  }

  const coll = new _TestCoercedTypeCollection();

  // Set to true after coll.emit("duplicate-key") has been detected; this is
  // not strictly required but helps to ensure the test is running properly
  let _isDuplicateKeyCaptured = false;

  await Promise.all([
    new Promise(resolve => {
      coll.once("duplicate-key", () => {
        t.ok("duplicate key is captured");

        _isDuplicateKeyCaptured = true;

        resolve();
      });
    }),

    new Promise(resolve => {
      const testObject1 = { id: 1, foo: 123 };
      const testObject2 = { id: 2, foo: 456 };

      t.ok(!_hasDuplicate, "no duplicate key detected before start");

      coll.addChild(testObject1, testObject1.id);
      coll.addChild(testObject2, testObject2.id);

      t.ok(!_hasDuplicate, "no duplicate key detected on first run");

      coll.addChild(testObject1, testObject1.id);
      coll.addChild(testObject2, testObject2.id);

      t.ok(_hasDuplicate, "duplicate key detected on second run");
      t.notOk(
        Object.is(testObject1, testObject1.id),
        "coerced test collection does not return original object on key lookup"
      );

      t.equals(
        coll.getChildren().length,
        2,
        "2 total children detected after duplicate test add"
      );

      coll.addChild({}, testObject1.id);
      coll.addChild({}, testObject2.id);
      coll.addChild({}, "a-unique-id");

      t.equals(
        coll.getChildren().length,
        3,
        "3 total children detected after second duplicate test add"
      );

      resolve();
    }),
  ]);

  t.ok(_isDuplicateKeyCaptured, "detects duplicate key has been captured");

  t.end();
});

test("PhantomCollection destruct all children", async t => {
  t.plan(17);

  const child1 = new PhantomCore();
  const child2 = new PhantomCore();
  const child3 = new PhantomCore();
  const child4 = new PhantomCore();
  const child5 = new PhantomCore();

  const coll1 = new PhantomCollection([child1, child2, child3, child4, child5]);
  const coll2 = new PhantomCollection([child1, child2, child3, child4, child5]);

  t.equals(coll1.getChildren().length, 5, "coll1 has 5 initial children");
  t.equals(coll2.getChildren().length, 5, "coll2 has 5 initial children");

  t.equals(
    coll1._lenChildren,
    5,
    "_lenChildren is 5 before first collection is destroyed"
  );

  await coll1.destroy();

  t.equals(
    coll1._lenChildren,
    0,
    "_lenChildren is 0 after first collection is destroyed"
  );

  t.ok(coll1.getIsDestroyed(), "coll1 is in destructed state");

  t.equals(
    coll2.getChildren().length,
    5,
    "coll2 has 5 children after coll1 destruct"
  );

  [child1, child2, child3, child4, child5].forEach((child, idx) => {
    t.ok(
      !child.getIsDestroyed(),
      `child${idx + 1} is not automatically destructed after coll1 destruct`
    );
  });

  await coll2.destroyAllChildren();

  [child1, child2, child3, child4, child5].forEach((child, idx) => {
    t.ok(
      child.getIsDestroyed(),
      `child${
        idx + 1
      } is automatically destructed after coll destroyAllChildren() is invoked`
    );
  });

  t.equals(
    coll2.getChildren().length,
    0,
    "coll2 reports 0 children after all children have been destructed"
  );

  t.end();
});

test("PhantomCollection diff", t => {
  t.plan(3);

  const phantom1 = new PhantomCore();
  const phantom2 = new PhantomCore();
  const phantom3 = new PhantomCore();
  const phantom4 = new PhantomCore();
  const phantom5 = new PhantomCore();

  t.deepEquals(
    PhantomCollection.getChildrenDiff(
      [phantom1, phantom2, phantom3, phantom4],
      [phantom2, phantom4, phantom5]
    ),
    {
      added: [phantom5],
      removed: [phantom1, phantom3],
    },
    "determines diff against array of PhantomObjects"
  );

  const obj1 = { testObject: 1 };
  const obj2 = { testObject: 2 };
  const obj3 = { testObject: 3 };
  const obj4 = { testObject: 4 };
  const obj5 = { testObject: 5 };

  t.deepEquals(
    PhantomCollection.getChildrenDiff(
      [obj1, obj2, obj3, obj4],
      [obj2, obj4, obj5]
    ),
    {
      added: [obj5],
      removed: [obj1, obj3],
    },
    "determines diff against array of objects"
  );

  t.deepEquals(
    PhantomCollection.getChildrenDiff(
      [obj1, obj2, obj3, obj4],
      [obj1, obj2, obj3, obj4]
    ),
    {
      added: [],
      removed: [],
    },
    "uses empty arrays for added and removed when nothing has changed"
  );

  t.end();
});
