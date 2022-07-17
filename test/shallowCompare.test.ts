import test from "tape";
import { shallowCompare } from "../src";

test("shallowCompare", t => {
  t.plan(4);

  const objectA = {
    test: 123,
    foo: "bar",
  };

  const objectB = {
    test: 123,
    foo: "bar",
  };

  const objectC = {
    test: 234,
    foo: "122",
  };

  t.ok(
    shallowCompare(objectA, objectA),
    "returns true if object equals itself"
  );
  t.ok(
    shallowCompare(objectA, objectB),
    "returns true if two objects have same shallow values"
  );
  t.notOk(
    shallowCompare(objectA, objectC),
    "returns false if two objects have different shallow value"
  );
  t.ok(shallowCompare(null, null)), "returns true if comparing null to null";

  t.end();
});
