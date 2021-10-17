const test = require("tape-async");
const PhantomCore = require("../src");

// Note: Test case built from usage example, though this library is not
// included in the project: https://github.com/sindresorhus/auto-bind
test("PhantomCore method auto-binding", async t => {
  t.plan(6);

  const p1Default = new PhantomCore();
  const p2AutoBind = new PhantomCore({
    hasAutomaticBindings: true,
  });

  t.deepEquals(
    p1Default.getOptions(),
    p2AutoBind.getOptions(),
    "hasAutomaticBindings are enabled by default"
  );

  const p3NonAutoBind = new PhantomCore({
    hasAutomaticBindings: false,
  });

  t.equals(
    p3NonAutoBind.getOptions().hasAutomaticBindings,
    false,
    "hasAutomaticBindings can be disabled in options"
  );

  const p1GetClassName = p1Default.getClassName;
  const p2GetClassName = p2AutoBind.getClassName;
  const p3GetClassName = p3NonAutoBind.getClassName;

  t.equals(p1GetClassName(), p2GetClassName());

  t.throws(
    p3GetClassName,
    TypeError,
    "TypeError is thrown on non-auto-bound reference"
  );

  p3NonAutoBind.autoBind();

  const p3GetClassNameV2 = p3NonAutoBind.getClassName;

  t.equals(
    p2GetClassName(),
    p3GetClassNameV2(),
    "calling autoBind on non-automatic-bindings class binds properties"
  );

  p3NonAutoBind.autoBind();

  const p3GetClassNameV3 = p3NonAutoBind.getClassName;

  t.equals(
    p2GetClassName(),
    p3GetClassNameV3(),
    "subsequent calls to auto-bind do not affect equality" // Though they probably should not be called multiple times
  );

  t.end();
});
