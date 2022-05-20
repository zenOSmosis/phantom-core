const test = require("tape");
const PhantomCore = require("../dist");

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

test("auto-bind no re-bind", t => {
  t.plan(2);

  class TestPhantom1 extends PhantomCore {}
  class TestPhantom2 extends PhantomCore {}

  const p1 = new TestPhantom1();
  const p2 = new TestPhantom2();

  // Attempt cross instance rebinding
  // NOTE: This should not re-bind due to bind preventing re-binds
  p1.getClassName = p1.getClassName.bind(p2);
  p2.getClassName = p2.getClassName.bind(p1);

  t.equals(
    p1.getClassName(),
    "TestPhantom1",
    "subsequent cross-binding has no effect on auto-bound instance 1"
  );
  t.equals(
    p2.getClassName(),
    "TestPhantom2",
    "subsequent cross-binding has no effect on auto-bound instance 2"
  );

  t.end();
});

test("non-auto-bind subsequent bind", t => {
  t.plan(2);

  class TestPhantom3 extends PhantomCore {}
  class TestPhantom4 extends PhantomCore {}

  const p3 = new TestPhantom3({
    hasAutomaticBindings: false,
  });

  const p4 = new TestPhantom4({
    hasAutomaticBindings: false,
  });

  // Attempt cross instance binding
  // NOTE: These should bind due to hasAutomaticBindings being disabled
  p3.getClassName = p3.getClassName.bind(p4);
  p4.getClassName = p4.getClassName.bind(p3);

  t.notEquals(
    p3.getClassName(),
    "TestPhantom3",
    "subsequent cross-binding has effect on non-auto-bound instance 3"
  );
  t.notEquals(
    p4.getClassName(),
    "TestPhantom4",
    "subsequent cross-binding has effect on non-auto-bound instance 4"
  );
});
