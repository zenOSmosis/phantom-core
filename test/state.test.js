const test = require("tape");
const { PhantomState } = require("../src");
const { EVT_UPDATED } = PhantomState;

test("phantom state", async t => {
  t.plan(5);

  class ExtendedState extends PhantomState {
    constructor() {
      super();

      this.setState({
        someInitialFirstStateBoolean: true,
      });
    }
  }

  const extendedState = new ExtendedState();

  t.deepEquals(
    extendedState.getState(),
    {
      someInitialFirstStateBoolean: true,
    },
    "state is able to be obtained from extended state"
  );

  extendedState.setState({
    // someInitialFirstStateBoolean: false,
    test: 123,
    subObject: {
      foo: "bar",
      test: 123,
      nl: null,
    },
  });

  t.deepEquals(
    extendedState.getState(),
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

  extendedState.setState({
    // someInitialFirstStateBoolean: false,
    test: 123,
    subObject: {
      foo: "test",
    },
  });

  t.deepEquals(
    extendedState.getState(),
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
      extendedState.setState("abc");
    },
    TypeError,
    "setState must be called with an object"
  );

  await Promise.all([
    new Promise(resolve => {
      extendedState.once(EVT_UPDATED, () => {
        t.deepEquals(
          extendedState.getState(),
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
      extendedState.setState({
        test: 456,
      });

      resolve();
    }),
  ]);

  // TODO: Add test to ensure state is cleared once destructed

  t.end();
});
