import test from "tape";

import * as PhantomCoreExports from "../../src/PhantomCore";
import * as ArbitraryPhantomWrapperExports from "../../src/ArbitraryPhantomWrapper";
import * as PhantomCollectionExports from "../../src/PhantomCollection";
import * as PhantomStateExports from "../../src/PhantomState";
import * as PhantomSerializableStateExports from "../../src/PhantomSerializableState";
import * as PhantomServiceCoreExports from "../../src/PhantomServiceCore";
import * as PhantomServiceManagerExports from "../../src/PhantomServiceManager";
import * as PhantomWatcherExports from "../../src/PhantomWatcher";

import {
  EVT_ERROR,
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIME_OUT,
  EVT_DESTROY,
  EVT_NO_INIT_WARN,
  compareExportedEvents,
} from "../../src";

test("PhantomCore events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(PhantomCoreExports, {
      EVT_ERROR,
      EVT_READY,
      EVT_UPDATE,
      EVT_BEFORE_DESTROY,
      EVT_DESTROY_STACK_TIME_OUT,
      EVT_DESTROY,
      EVT_NO_INIT_WARN,
    });
  }, "PhantomCore exports expected events");

  t.end();
});

test("ArbitraryPhantomWrapper events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(PhantomCoreExports, ArbitraryPhantomWrapperExports);
  }, "ArbitraryPhantomWrapper exports expected events");

  t.end();
});

test("PhantomCollection events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(PhantomCoreExports, PhantomCollectionExports);
  }, "PhantomCollection exports expected events");

  t.end();
});

test("PhantomState events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(PhantomCoreExports, PhantomStateExports);
  }, "PhantomState exports expected events");

  t.end();
});

test("PhantomSerializableState events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(PhantomCoreExports, PhantomSerializableStateExports);
  }, "PhantomSerializableState exports expected events");

  t.end();
});

test("PhantomServiceCore events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(PhantomStateExports, PhantomServiceCoreExports);
  }, "PhantomServiceCore exports expected events");

  t.end();
});

test("PhantomServiceManager events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(
      PhantomCollectionExports,
      PhantomServiceManagerExports
    );
  }, "PhantomServiceManager exports expected events");

  t.end();
});

test("PhantomWatcher events", t => {
  t.plan(1);

  t.doesNotThrow(() => {
    compareExportedEvents(PhantomCoreExports, PhantomWatcherExports);
  }, "PhantomWatcher exports expected events");

  t.end();
});
