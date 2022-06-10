const test = require("tape");
import { PhantomCore, LogLevel, globalLogger } from "../src";

// TODO: Add log miss testing

test("phantom-core uses globalLogger.info when calling calling phantom.log() directly", t => {
  t.plan(1);

  const phantom = new PhantomCore();
  phantom.log("hello");

  t.ok(true, "call to phantom.log() does not error");

  t.end();
});

test("log level steps", t => {
  t.plan(6);

  t.ok(LogLevel.Silent === 0);
  t.ok(LogLevel.Error === LogLevel.Silent + 1);
  t.ok(LogLevel.Warn === LogLevel.Error + 1);
  t.ok(LogLevel.Info === LogLevel.Warn + 1);
  t.ok(LogLevel.Debug === LogLevel.Info + 1);
  t.ok(LogLevel.Trace === LogLevel.Debug + 1);

  t.end();
});

test("default logging level", async t => {
  t.plan(1);

  const phantom = new PhantomCore();

  t.equals(
    phantom.getLogLevel(),
    LogLevel.Info,
    "LogLevel.Info default logging level"
  );

  await phantom.destroy();

  t.end();
});

test("set log level", async t => {
  t.plan(14);

  const phantom = new PhantomCore();

  t.throws(() => {
    phantom.setLogLevel("notvalid");
  }, "throws at unexpected log level");

  t.equals(
    phantom.getLogLevel(),
    LogLevel.Info,
    "retains LogLevel.Info after trying to set invalid log level"
  );

  phantom.setLogLevel("trace");
  t.equals(
    phantom.getLogLevel(),
    LogLevel.Trace,
    'accepts string value "trace"'
  );

  phantom.setLogLevel("debug");
  t.equals(
    phantom.getLogLevel(),
    LogLevel.Debug,
    'accepts string value "debug"'
  );

  phantom.setLogLevel("info");
  t.equals(phantom.getLogLevel(), LogLevel.Info, 'accepts string value "info"');

  phantom.setLogLevel("warn");
  t.equals(phantom.getLogLevel(), LogLevel.Warn, 'accepts string value "warn"');

  phantom.setLogLevel("error");
  t.equals(
    phantom.getLogLevel(),
    LogLevel.Error,
    'accepts string value "error"'
  );

  phantom.setLogLevel("silent");
  t.equals(
    phantom.getLogLevel(),
    LogLevel.Silent,
    'accepts string value "error"'
  );

  phantom.setLogLevel(LogLevel.Trace);
  t.equals(
    phantom.getLogLevel(),
    LogLevel.Trace,
    "accepts numeric value LogLevel.Trace"
  );

  phantom.setLogLevel(LogLevel.Debug);
  t.equals(
    phantom.getLogLevel(),
    LogLevel.Debug,
    "accepts numeric value LogLevel.Debug"
  );

  phantom.setLogLevel(LogLevel.Info);
  t.equals(
    phantom.getLogLevel(),
    LogLevel.Info,
    "accepts numeric value LogLevel.Info"
  );

  phantom.setLogLevel(LogLevel.Warn);
  t.equals(
    phantom.getLogLevel(),
    LogLevel.Warn,
    "accepts numeric value LogLevel.Warn"
  );

  phantom.setLogLevel(LogLevel.Error);
  t.equals(
    phantom.getLogLevel(),
    LogLevel.Error,
    "accepts numeric value LogLevel.Error"
  );

  phantom.setLogLevel(LogLevel.Silent);
  t.equals(
    phantom.getLogLevel(),
    LogLevel.Silent,
    "accepts numeric value LogLevel.Silent"
  );

  await phantom.destroy();

  t.end();
});

test("PhantomCore this.log and this.logger calls", async t => {
  t.plan(8);

  const phantom = new PhantomCore();

  // phantom.log and phantom.logger can be called independently and are treated
  // the same for all usages except that calling phantom.log() directly will
  // indirectly call globalLogger.info

  phantom.log("ok");
  t.ok(true, "call to phantom.log() succeeds");
  phantom.logger.log("ok");
  t.ok(true, "call to phantom.logger.log() succeeds");

  phantom.log.debug("ok");
  t.ok(true, "call to phantom.log.debug() succeeds");
  phantom.logger.debug("ok");
  t.ok(true, "call to phantom.logger.debug() succeeds");

  phantom.log.warn("ok");
  t.ok(true, "call to phantom.log.warn() succeeds");
  phantom.logger.warn("ok");
  t.ok(true, "call to phantom.logger.warn() succeeds");

  phantom.log.error("ok");
  t.ok(true, "call to phantom.log.error() succeeds");
  phantom.logger.error("ok");
  t.ok(true, "call to phantom.logger.error() succeeds");

  await phantom.destroy();

  t.end();
});

test("independent logger", t => {
  t.plan(6);

  globalLogger.log("ok");
  // FIXME: Use sinon to ensure this calls globalLogger.info
  t.ok(true, "call to globalLogger.log() succeeds");

  globalLogger.log.error("ok");
  globalLogger.error("ok");
  t.ok(true, "call to globalLogger.error() succeeds");

  globalLogger.log.warn("ok");
  globalLogger.warn("ok");
  t.ok(true, "call to globalLogger.warn() succeeds");

  globalLogger.log.info("ok");
  globalLogger.info("ok");
  t.ok(true, "call to globalLogger.info() succeeds");

  globalLogger.log.debug("ok");
  globalLogger.debug("ok");
  t.ok(true, "call to globalLogger.debug() succeeds");

  globalLogger.log.trace("ok");
  globalLogger.trace("ok");
  t.ok(true, "call to globalLogger.trace() succeeds");

  t.end();
});
