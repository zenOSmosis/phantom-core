const test = require("tape");
const PhantomCore = require("../dist");
const { ArbitraryPhantomWrapper } = PhantomCore;

test("ArbitraryPhantomWrapper handling", async t => {
  t.plan(5);

  t.throws(
    () => new ArbitraryPhantomWrapper(),
    ReferenceError,
    "throws ReferenceError if instantiated without any arguments"
  );

  const wrapper = new ArbitraryPhantomWrapper("test-wrap", {
    testOption: "test-option-value",
  });

  t.equals(
    wrapper.getWrappedValue(),
    "test-wrap",
    "wrapped value can be obtained"
  );

  t.throws(
    () => wrapper._setWrappedValue("test"),
    Error,
    "_setWrappedValue cannot be called more than once"
  );

  t.equals(
    wrapper.getOptions().testOption,
    "test-option-value",
    "class options are passed to PhantomCore superclass"
  );

  await wrapper.destroy();

  t.equals(
    wrapper._wrappedValue,
    null,
    "_wrappedValue is set to null after destruct"
  );

  t.end();
});
