const test = require("tape");
const { PhantomSerializableState } = require("../src");
const { EVT_UPDATED } = PhantomSerializableState;

test("phantom serial state", async t => {
  // TODO: Implement
  // t.plan()

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
  });

  // TODO: Add description
  t.deepEquals(serialState.getState(), initialState);

  const serializedState =
    '{"str":"string","num":0,"obj":{"foo":"foo"},"arr":[1,2,3],"bool":true,"nil":null}';

  // TODO: Add description
  t.equals(serialState.getSerializedState(), serializedState);

  // TODO: Add description
  t.deepEquals(serialState.toObject(serializedState), initialState);

  // TODO: Add description
  t.equals(serialState.toSerial(serialState.getState()), serializedState);

  // TODO: Add additional testing for invalid types

  t.end();
});
