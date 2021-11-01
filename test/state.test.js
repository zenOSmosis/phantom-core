const test = require("tape");
const { PhantomState } = require("../src");
const { EVT_UPDATED } = PhantomState;

test("phantom state", async t => {
  t.plan(7);

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

  t.notDeepEquals(
    extendedState._state,
    {},
    "state is not cleared before destruct"
  );

  await extendedState.destroy();

  t.deepEquals(extendedState._state, {}, "state is cleared after destruct");

  t.end();
});

test("phantom state async init", t => {
  t.plan(2);

  class AsyncPhantomState extends PhantomState {
    constructor() {
      super({}, { isAsync: true });

      this._init();
    }

    async _init() {
      t.ok("async _init is called in AsyncPhantomState");

      super._init();
    }
  }

  new AsyncPhantomState();

  class SyncPhantomState extends PhantomState {
    constructor() {
      super({}, { isAsync: false });

      this._init();
    }

    async _init() {
      super._init();
    }
  }

  t.throws(
    () => {
      new SyncPhantomState();
    },
    TypeError,
    "_init cannot be called with SyncPhantomState"
  );

  t.end();
});
