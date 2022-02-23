const test = require("tape");
const PhantomCore = require("../src");
const { EVT_UPDATED, EVT_BEFORE_DESTROY, EVT_DESTROYED } = PhantomCore;
const EventEmitter = require("events");
const PhantomCollection = require("../src/PhantomCollection");
const { EVT_CHILD_INSTANCE_ADDED, EVT_CHILD_INSTANCE_REMOVED } =
  PhantomCollection;

const _ChildEventBridge = require("../src/PhantomCollection/ChildEventBridge");

test("PhantomCollection loose instance detection", t => {
  t.plan(2);

  const collection = new PhantomCollection();
  const phantom = new PhantomCore();

  t.ok(
    PhantomCollection.getIsLooseInstance(collection),
    "collection is loose instance of PhantomCollection"
  );

  t.notOk(
    PhantomCollection.getIsLooseInstance(phantom),
    "phantom is not a loose instance of PhantomCollection"
  );

  t.end();
});

test("PhantomCollection add multiple children without keys", async t => {
  t.plan(2);

  const collection = new PhantomCollection();

  collection.addChild(new PhantomCore());
  collection.addChild(new PhantomCore());
  collection.addChild(new PhantomCore());
  collection.addChild(new PhantomCore());

  t.equals(
    collection.getChildren().length,
    4,
    "Multiple children can be added without keys"
  );

  t.deepEquals(collection.getKeys(), [], "getKeys() returns an empty array");

  t.end();
});

test("PhantomCollection children event handler cleanup", async t => {
  t.plan(2);

  const phantom = new PhantomCore();

  const collection = new PhantomCollection();

  const initialListenerCount = phantom.getTotalListenerCount();

  collection.addChild(phantom);

  t.equals(
    phantom.getTotalListenerCount(),
    initialListenerCount + 2,
    "adding child to collection increments child event emitters by two (one for proxyOn binding, another for collection event destroyed)"
  );

  collection.removeChild(phantom);

  t.equals(
    phantom.getTotalListenerCount(),
    initialListenerCount,
    "removing child from collection resets child event emitters to original value"
  );

  t.end();
});

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

  t.deepEquals(
    collection.getKeys(),
    ["temp-child"],
    "getKeys() responds with added child key"
  );

  t.equals(
    collection._lenChildren,
    2,
    "protected _lenChildren equals 2 after temp child added"
  );

  t.doesNotThrow(() => {
    collection.removeChild(collection.getChildWithKey("temp-child"));
  }, 'collection removes child with "temp-child" key');

  t.deepEquals(collection.getKeys(), [], "getKeys() responds with no keys");

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
  const lenEC2InitialDestroyedEvents = ec2.listenerCount(EVT_DESTROYED);

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

  await (async () => {
    const autoDestructChild = new PhantomCore();

    await Promise.all([
      new Promise(resolve => {
        collection.once(EVT_CHILD_INSTANCE_REMOVED, childInstance => {
          t.ok(
            Object.is(childInstance, autoDestructChild),
            "collection emits EVT_CHILD_INSTANCE_REMOVED when child destructs"
          );

          resolve();
        });
      }),

      new Promise(resolve => {
        setTimeout(async () => {
          await autoDestructChild.destroy();

          resolve();
        }, 500);
      }),

      collection.addChild(autoDestructChild, "test-auto-destruct-child"),
    ]);
  })();

  t.doesNotThrow(() => {
    collection.addChild(ec2);
  }, "child can be re-added to collection");

  t.equals(
    ec2.listenerCount(EVT_DESTROYED),
    lenEC2InitialDestroyedEvents + 1,
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
    lenEC2InitialDestroyedEvents,
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

        // FIXME: (jh) Remove?  Why is this needed?
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
      28,
      "initial mapped child events before initial collection destruct is 28"
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

    // FIXME: (jh) Use this somehow?
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
  t.plan(11);

  const coll = new PhantomCollection();

  const tPhantom1 = new PhantomCore();
  coll.addChild(tPhantom1, "tPhantom1-test-key");
  t.ok(
    Object.is(tPhantom1, coll.getChildWithKey("tPhantom1-test-key")),
    "obtains child1 with associated key"
  );

  t.equals(
    coll.getChildWithKey(),
    undefined,
    "getChildWithKey() with no arguments returns undefined"
  );

  t.ok(coll.getChildren().length, 1, "detects one child after first child add");

  (() => {
    t.throws(
      () => {
        coll.addChild(new PhantomCore(), "tPhantom1-test-key");
      },
      ReferenceError,
      "throws when trying to add another child with same test key"
    );

    const prevLength = coll.getChildren().length;

    t.doesNotThrow(() => {
      coll.addChild(
        coll.getChildWithKey("tPhantom1-test-key"),
        "tPhantom1-test-key"
      );
    }, "does not throw when trying to re-add a child with the same test key");

    const postLength = coll.getChildren().length;

    t.equals(
      prevLength,
      postLength,
      "silently ignores duplicate child with same key add attempt"
    );
  })();

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

test("multiple PhantomCollection destruct all children", async t => {
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

  await Promise.all([coll2.destroyAllChildren()]);

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

test("PhantomCollection child event proxies during shutdown", async t => {
  t.plan(1);

  const child1 = new PhantomCore();
  const child2 = new PhantomCore();

  const child3 = new PhantomCore();
  child3.once(EVT_DESTROYED, () => {
    child3.emit("__TESTING__-destruct-event-emitted", "test-data-b");
  });

  const child4 = new PhantomCore();
  const child5 = new PhantomCore();

  const coll = new PhantomCollection([child1, child2, child3, child4, child5]);
  coll.bindChildEventName("__TESTING__-destruct-event-emitted");

  await Promise.all([
    new Promise(resolve => {
      coll.once("__TESTING__-destruct-event-emitted", data => {
        if (data === "test-data-b") {
          t.ok(
            true,
            "received expected event data during destruct event phase"
          );

          resolve();
        }
      });
    }),

    child3.destroy(),
  ]);

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

test("PhantomCollection empty destroyAllChildren() call", async t => {
  t.plan(1);

  const collection = new PhantomCollection();

  await collection.destroyAllChildren();

  t.ok("does not throw if calling destroyAllChildren() with no added children");

  t.end();
});

test("PhantomCollection iterator", async t => {
  t.plan(4);

  const p1 = new PhantomCore();
  const p2 = new PhantomCore();
  const p3 = new PhantomCore();
  const p4 = new PhantomCore();
  const p5 = new PhantomCore();

  const collection = new PhantomCollection([p1, p2, p3, p4, p5]);

  t.equals([...collection].length, 5);

  await p3.destroy();

  t.equals([...collection].length, 4);

  await p5.destroy();

  t.equals([...collection].length, 3);

  await collection.destroy();

  t.throws(
    () => {
      [...collection];
    },
    TypeError,
    "collection is no longer iterable after destruct"
  );

  t.end();
});

test("PhantomCollection children ignored destructing / destructed children", async t => {
  t.plan(6);

  const child = new PhantomCore();

  const collection1 = new PhantomCollection([child]);
  const collection2 = new PhantomCollection([child]);

  t.ok(
    collection1.getChildren().length === 1,
    "collection1 shows 1 child before destructing"
  );
  t.ok(
    collection2.getChildren().length === 1,
    "collection2 shows 1 child before destructing"
  );

  await Promise.all([
    new Promise(resolve => {
      child.once(EVT_BEFORE_DESTROY, () => {
        t.ok(
          collection1.getChildren().length === 0,
          "collection1 shows no children when destructing"
        );

        t.ok(
          collection2.getChildren().length === 0,
          "collection2 shows no children when destructing"
        );

        resolve();
      });
    }),

    new Promise(resolve => {
      child.once(EVT_DESTROYED, () => {
        t.ok(
          collection1.getChildren().length === 0,
          "collection1 shows no children when destructed"
        );

        t.ok(
          collection2.getChildren().length === 0,
          "collection2 shows no children when destructing"
        );

        resolve();
      });
    }),

    child.destroy(),
  ]);

  t.end();
});

test("PhantomCollection emits EVT_UPDATED on child destruct", async t => {
  t.plan(3);

  const child = new PhantomCore();
  const collection = new PhantomCollection([child]);

  t.equals(collection.getChildren().length, 1, "collection has one child");

  await Promise.all([
    new Promise(resolve => {
      collection.on(EVT_UPDATED, () => {
        t.ok(child.getIsDestroyed(), "child is destructed");

        t.equals(
          collection.getChildren().length,
          0,
          "collection has no remaining children"
        );

        resolve();
      });
    }),
    child.destroy(),
  ]);

  t.end();
});

test("child to collection to master collection event passing", async t => {
  t.plan(8);

  const child = new PhantomCore();

  const collection1 = new PhantomCollection([child]);
  const collection2 = new PhantomCollection([child]);

  const masterCollection = new PhantomCollection([collection1, collection2]);

  t.ok(collection1.getChildren().length === 1);
  t.ok(collection2.getChildren().length === 1);

  await Promise.all([
    new Promise(resolve => {
      collection1.on(EVT_UPDATED, data => {
        if (data === "testing 1 2 3") {
          t.ok(true, "collection1 received expected test data from child");
        } else if (collection1.getChildren().length === 0) {
          t.ok(true, "collection1 successfully deregistered child");

          resolve();
        }
      });
    }),
    new Promise(resolve => {
      collection2.on(EVT_UPDATED, data => {
        if (data === "testing 1 2 3") {
          t.ok(true, "collection2 received expected test data from child");
        } else if (collection2.getChildren().length === 0) {
          t.ok(true, "collection2 successfully deregistered child");

          resolve();
        }
      });
    }),
    new Promise(resolve => {
      masterCollection.on(EVT_UPDATED, data => {
        if (data === "testing 1 2 3") {
          // This will be invoked twice since collection1 and collection2 will update
          t.ok(
            true,
            "master collection received expected test data from proxied child"
          );

          resolve();
        }
      });
    }),
    child.emit(EVT_UPDATED, "testing 1 2 3"),
    child.destroy(),
  ]);

  t.end();
});

test("collection does not contain destructed children", async t => {
  t.plan(4);

  class TestCollection extends PhantomCollection {
    addChild(child) {
      // NOTE: Though not typical, if adding the EVT_DESTROYED handler to the
      // call BEFORE adding it to the collection, that initial EVT_DESTROYED
      // handler will be invoked before the collection invokes its own handler,
      // making it appear that the collection has more children than it should
      // during that event loop cycle if destructed children are not filtered
      // out
      child.once(EVT_DESTROYED, () => {
        t.ok(
          this.getChildren().length === 0,
          "does not contain destructed children from getChildren() call"
        );
        t.ok(
          [...this].length === 0,
          "does not contain destructed members in [...iteration]"
        );
      });

      super.addChild(child);

      t.ok(
        this.getChildren().length === 1,
        "contains initial added child in getChildren() call"
      );
      t.ok(
        [...this].length === 1,
        "contains initial added child in [...iteration]"
      );
    }
  }

  const child = new PhantomCore();
  new TestCollection([child]);

  await child.destroy();

  t.end();
});

test("PhantomCollection children maintain stable reference integrity between calls", t => {
  t.plan(2);

  const collection = new PhantomCollection([
    new PhantomCore(),
    new PhantomCore(),
    new PhantomCore(),
  ]);

  t.equals(collection.getChildren().length, 3);

  t.ok(
    collection.getChildren() === collection.getChildren(),
    "two calls to collection.getChildren() return the same stable reference"
  );

  t.end();
});
