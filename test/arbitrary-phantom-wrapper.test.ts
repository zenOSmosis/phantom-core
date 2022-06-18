import test from "tape";
import { ArbitraryPhantomWrapper } from "../src";

test("ArbitraryPhantomWrapper handling", async t => {
  t.plan(5);

  t.throws(
    // Intentional error
    // @ts-ignore
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
    // Intentional error
    // @ts-ignore
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
    // @ts-ignore
    wrapper._wrappedValue,
    null,
    "_wrappedValue is set to null after destruct"
  );

  t.end();
});
