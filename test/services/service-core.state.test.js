const test = require("tape");
const { PhantomServiceCore, PhantomServiceManager } = require("../../src");
const { EVT_UPDATED } = PhantomServiceCore;

test("service state", async t => {
  t.plan(5);

  class TestService extends PhantomServiceCore {
    constructor({ ...args }) {
      super({
        ...args,
      });

      this.setState({
        someInitialFirstStateBoolean: true,
      });
    }
  }

  const serviceManager = new PhantomServiceManager();

  serviceManager.startServiceClass(TestService);

  t.deepEquals(
    serviceManager.getServiceInstance(TestService).getState(),
    {
      someInitialFirstStateBoolean: true,
    },
    "state is able to be obtained from linked service"
  );

  const testService = serviceManager.getServiceInstance(TestService);

  testService.setState({
    // someInitialFirstStateBoolean: false,
    test: 123,
    subObject: {
      foo: "bar",
      test: 123,
      nl: null,
    },
  });

  t.deepEquals(
    testService.getState(),
    {
      someInitialFirstStateBoolean: true,
      test: 123,
      subObject: {
        foo: "bar",
        test: 123,
        nl: null,
      },
    },
    "setState performs shallow merging"
  );

  testService.setState({
    // someInitialFirstStateBoolean: false,
    test: 123,
    subObject: {
      foo: "test",
    },
  });

  t.deepEquals(
    testService.getState(),
    {
      someInitialFirstStateBoolean: true,
      test: 123,
      subObject: {
        foo: "test",
      },
    },
    "setState does not perform deep merging"
  );

  t.throws(
    () => {
      testService.setState("abc");
    },
    TypeError,
    "setState must be called with an object"
  );

  await Promise.all([
    new Promise(resolve => {
      testService.once(EVT_UPDATED, () => {
        t.deepEquals(
          testService.getState(),
          {
            someInitialFirstStateBoolean: true,
            test: 456,
            subObject: {
              foo: "test",
            },
          },
          "EVT_UPDATED is emit when state is updated"
        );

        resolve();
      });
    }),

    new Promise(resolve => {
      testService.setState({
        test: 456,
      });

      resolve();
    }),
  ]);

  // TODO: Add test to ensure state is cleared once destructed

  t.end();
});
