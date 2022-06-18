import test from "tape";
import { PhantomSerializableState } from "../src";

test("phantom serialized state", async t => {
  t.plan(23);

  // NOTE: Test types were borrowed from: https://www.npmjs.com/package/serialize-javascript
  const initialState = Object.freeze({
    str: "string",
    num: 0,
    obj: { foo: "foo" },
    arr: [1, 2, 3],
    bool: true,
    nil: null,
    // undef: undefined,
    // inf: Infinity,
    // date: new Date("Thu, 28 Apr 2016 22:02:17 GMT"),
    // map: new Map([["hello", "world"]]),
    // set: new Set([123, 456]),
    /*
      fn: function echo(arg) {
        return arg;
      },
      */
    // re: /([^\s]+)/g,
    // big: BigInt(10),
  });

  const serialState = new PhantomSerializableState(initialState, {
    fakeOptionA: true,
    fakeOptionB: false,
  });

  t.deepEquals(
    serialState.getState(),
    initialState,
    "initial state is set on construct"
  );

  t.deepEquals(
    // FIXME: (jh) Not sure if tape can validate partial structures, but this
    // is what this is doing
    (() => {
      const { fakeOptionA, fakeOptionB } = serialState.getOptions();

      return {
        fakeOptionA,
        fakeOptionB,
      };
    })(),
    {
      fakeOptionA: true,
      fakeOptionB: false,
    },
    "options are obtainable"
  );

  const serializedState =
    '{"str":"string","num":0,"obj":{"foo":"foo"},"arr":[1,2,3],"bool":true,"nil":null}';

  t.equals(
    serialState.getSerializedState(),
    serializedState,
    "getSerializedState matches expected output"
  );

  t.equals(
    PhantomSerializableState.serialize(serialState.getState()),
    serializedState,
    "serializes to expected serialized state"
  );

  t.deepEquals(
    PhantomSerializableState.unserialize(serializedState),
    initialState,
    "unserializes back to initial state"
  );

  serialState.setState({
    newThing: true,
  });

  t.deepEquals(
    serialState.getState(),
    {
      ...initialState,
      newThing: true,
    },
    "updates previous state with setState"
  );

  // Non-merge
  serialState.setState({ hi: "there" }, false);

  t.deepEquals(
    serialState.getState(),
    { hi: "there" },
    "non-merge strategy sets full state as expected"
  );

  t.throws(() => {
    serialState.setState({ undef: undefined });
  }, "does not accept undefined in state");

  t.throws(() => {
    serialState.setState({ undef: undefined }, false);
  }, "does not accept undefined in state [no-merge]");

  t.throws(() => {
    serialState.setState({ inf: Infinity });
  }, "does not accept Infinity in state");

  t.throws(() => {
    serialState.setState({ inf: Infinity }, false);
  }, "does not accept Infinity in state [no-merge]");

  t.throws(() => {
    serialState.setState({ date: new Date("Thu, 28 Apr 2016 22:02:17 GMT") });
  }, "does not accept new Date() in state");

  t.throws(() => {
    serialState.setState(
      { date: new Date("Thu, 28 Apr 2016 22:02:17 GMT") },
      false
    );
  }, "does not accept new Date() in state [no-merge]");

  t.throws(() => {
    serialState.setState({ map: new Map([["hello", "world"]]) });
  }, "does not accept new Map() in state");

  t.throws(() => {
    serialState.setState({ map: new Map([["hello", "world"]]) }, false);
  }, "does not accept new Map() in state [no-merge]");

  t.throws(() => {
    serialState.setState({ set: new Set([123, 456]) });
  }, "does not accept new Map() in state");

  t.throws(() => {
    serialState.setState({ set: new Set([123, 456]) }, false);
  }, "does not accept new Map() in state [no-merge]");

  t.throws(() => {
    serialState.setState({
      fn: function echo(arg: unknown) {
        return arg;
      },
    });
  }, "does not accept function in state");

  t.throws(() => {
    serialState.setState(
      {
        fn: function echo(arg: unknown) {
          return arg;
        },
      },
      false
    );
  }, "does not accept function in state [no-merge]");

  t.throws(() => {
    serialState.setState({ re: /([^\s]+)/g });
  }, "does not accept regular expression in state");

  t.throws(() => {
    serialState.setState({ re: /([^\s]+)/g }, false);
  }, "does not accept regular expression in state [no-merge]");

  t.throws(() => {
    serialState.setState({ big: BigInt(10) });
  }, "does not accept BigInt in state");

  t.throws(() => {
    serialState.setState({ big: BigInt(10) }, false);
  }, "does not accept BigInt in state [no-merge]");

  t.end();
});
