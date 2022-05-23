import test from "tape";
import { PhantomState, EVT_UPDATE } from "../src";

test("phantom state", async t => {
  t.plan(10);

  class ExtendedState extends PhantomState {
    constructor() {
      super({ someInitialFirstStateBoolean: true }, { fakeOption: true });

      t.deepEquals(
        this.getState(),
        {
          someInitialFirstStateBoolean: true,
        },
        "initial state is set in constructor"
      );

      t.ok(
        this.getOptions().fakeOption,
        "options are passed through constructor"
      );
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
    "setState performs shallow merging by default"
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
      extendedState.once(EVT_UPDATE, () => {
        t.deepEquals(
          extendedState.getState(),
          {
            someInitialFirstStateBoolean: true,
            test: 456,
            subObject: {
              foo: "test",
            },
          },
          "EVT_UPDATE is emit when state is updated"
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

  // Non-merge
  extendedState.setState({ hello: "world" }, false);

  t.deepEquals(
    extendedState.getState(),
    { hello: "world" },
    "non-merge strategy sets full state as expected"
  );

  t.notDeepEquals(
    extendedState._state,
    {},
    "state is not cleared before destruct"
  );

  await extendedState.destroy();

  t.deepEquals(extendedState._state, null, "state is null after destruct");

  t.end();
});

test("null initial state", t => {
  t.plan(1);

  const phantomState = new PhantomState(null);

  t.equals(
    typeof phantomState.getState(),
    "object",
    "getState returns object even if initial state is null"
  );

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
    Error,
    "_init cannot be called in non-async mode"
  );

  t.end();
});
