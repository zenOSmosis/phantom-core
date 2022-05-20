const test = require("tape");
const {
  PhantomCollection,
  PhantomServiceCore,
  PhantomServiceManager,
  EVT_UPDATED,
} = require("../../dist");

test("service collections", async t => {
  t.plan(19);

  class TestCollection1 extends PhantomCollection {}
  class TestCollection2 extends PhantomCollection {}
  class TestCollection3 extends PhantomCollection {}
  class TestCollection4 extends PhantomCollection {}
  class TestCollection5 extends PhantomCollection {}

  class TestService extends PhantomServiceCore {}

  const serviceManager = new PhantomServiceManager();

  const testService = serviceManager.startServiceClass(TestService);

  t.equals(
    testService.getCollectionClasses().length,
    0,
    "getCollectionClasses() returns empty array with no bound collections"
  );

  t.throws(
    () => {
      testService.bindCollectionClass(new TestCollection1());
    },
    TypeError,
    "cannot bind instantiated collection"
  );

  t.throws(() => {
    testService.bindCollectionClass(PhantomServiceCore),
      TypeError,
      "cannot bind non-collection class as a collection";
  });

  const testCollectionInstance1A =
    testService.bindCollectionClass(TestCollection1);
  const testCollectionInstance1B =
    testService.bindCollectionClass(TestCollection1);

  const testCollectionInstance2A =
    testService.bindCollectionClass(TestCollection2);

  testService.bindCollectionClass(TestCollection3);
  testService.bindCollectionClass(TestCollection4);
  testService.bindCollectionClass(TestCollection5);

  await Promise.all([
    new Promise(resolve => {
      testService.once(EVT_UPDATED, data => {
        t.ok(
          data === "test data",
          "EVT_UPDATED events emit from service collection are proxied through the service with the associated data"
        );

        resolve();
      });
    }),
    testService
      .getCollectionInstance(TestCollection1)
      .emit(EVT_UPDATED, "test data"),
  ]);

  t.ok(
    testCollectionInstance1A instanceof TestCollection1,
    "bindCollectionClass returns instance of collection"
  );

  t.ok(
    Object.is(testCollectionInstance1B, testCollectionInstance1A),
    "subsequent calls to bindCollectionClass with the same collection class return the same class instance"
  );

  t.ok(
    !Object.is(testCollectionInstance2A, testCollectionInstance1A),
    "bindCollectionClass returns separate instance for separate collection class"
  );

  t.equals(
    testService.getCollectionClasses().length,
    5,
    "getCollectionClasses() returns length of bound classes"
  );

  testService.bindCollectionClass(TestCollection1);
  testService.bindCollectionClass(TestCollection2);
  testService.bindCollectionClass(TestCollection3);
  testService.bindCollectionClass(TestCollection4);
  testService.bindCollectionClass(TestCollection5);

  t.equals(
    testService.getCollectionClasses().length,
    5,
    "getCollectionClasses() returns length of bound classes"
  );

  const testCollection3 = testService.getCollectionInstance(TestCollection3);

  t.ok(
    testCollection3 instanceof TestCollection3,
    "testCollection3 is an instance of TestCollection3"
  );

  t.notOk(
    testCollection3 instanceof TestCollection4,
    "testCollection3 is not an instance of TestCollection4"
  );

  await testCollection3.destroy();

  t.equals(
    testService.getCollectionClasses().length,
    4,
    "getCollectionClasses() returns updated number after collection is destructed"
  );

  t.doesNotThrow(() => {
    testService.unbindCollectionClass(TestCollection3);
  }, "service does not throw if unbinding already destructed collection");

  const testCollection4 = testService.getCollectionInstance(TestCollection4);

  t.equals(
    testCollection4.getIsDestroyed(),
    false,
    "testCollection4 is not destructed before unbinding"
  );

  await testService.unbindCollectionClass(TestCollection4);

  t.equals(
    testCollection4.getIsDestroyed(),
    true,
    "testCollection4 is destructed after unbinding"
  );

  t.equals(
    testService.getCollectionClasses().length,
    3,
    "getCollectionClasses() returns updated number after collection is destructed"
  );

  const remainingCollectionClassInstances = testService
    .getCollectionClasses()
    .map(Class => testService.getCollectionInstance(Class));

  t.ok(
    remainingCollectionClassInstances.length > 1,
    "testService reports more than one active collection class"
  );

  t.notOk(
    remainingCollectionClassInstances.find(instance =>
      instance.getIsDestroyed()
    ),
    "currently active collection classes do not report destructed"
  );

  await testService.destroy();

  t.notOk(
    remainingCollectionClassInstances.find(
      instance => !instance.getIsDestroyed()
    ),
    "previously active collection classes report destructed after service destruct"
  );

  t.end();
});
