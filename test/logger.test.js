const test = require("tape-async");
const PhantomCore = require("../src");
const {
  LOG_LEVEL_TRACE,
  LOG_LEVEL_DEBUG,
  LOG_LEVEL_INFO,
  LOG_LEVEL_WARN,
  LOG_LEVEL_ERROR,
  LOG_LEVEL_SILENT,
  logger,
} = PhantomCore;

test("phantom-core uses logger.info when calling calling phantom.log() directly", t => {
  t.plan(1);

  const phantom = new PhantomCore();
  phantom.log("hello");

  t.ok(true, "call to phantom.log() does not error");

  t.end();
});

test("log level steps", t => {
  t.plan(6);

  t.ok(LOG_LEVEL_TRACE === 0);
  t.ok(LOG_LEVEL_DEBUG === LOG_LEVEL_TRACE + 1);
  t.ok(LOG_LEVEL_INFO === LOG_LEVEL_DEBUG + 1);
  t.ok(LOG_LEVEL_WARN === LOG_LEVEL_INFO + 1);
  t.ok(LOG_LEVEL_ERROR === LOG_LEVEL_WARN + 1);
  t.ok(LOG_LEVEL_SILENT === LOG_LEVEL_ERROR + 1);

  t.end();
});

test("default logging level", t => {
  t.plan(2);

  const phantom1 = new PhantomCore();

  t.equals(
    phantom1.getLogLevel(),
    LOG_LEVEL_INFO,
    "LOG_LEVEL_INFO default logging level"
  );

  const phantom2 = new PhantomCore({ logLevel: LOG_LEVEL_TRACE });

  t.equals(
    phantom2.getLogLevel(),
    LOG_LEVEL_TRACE,
    "Able to set custom logging level as constructor option"
  );

  phantom1.destroy();
  phantom2.destroy();

  t.end();
});

test("set log level", t => {
  t.plan(14);

  const phantom = new PhantomCore();

  t.throws(() => {
    phantom.setLogLevel("notvalid");
  }, "throws at unexpected log level");

  t.equals(
    phantom.getLogLevel(),
    LOG_LEVEL_INFO,
    "retains LOG_LEVEL_INFO after trying to set invalid log level"
  );

  phantom.setLogLevel("trace");
  t.equals(
    phantom.getLogLevel(),
    LOG_LEVEL_TRACE,
    'accepts string value "trace"'
  );

  phantom.setLogLevel("debug");
  t.equals(
    phantom.getLogLevel(),
    LOG_LEVEL_DEBUG,
    'accepts string value "debug"'
  );

  phantom.setLogLevel("info");
  t.equals(
    phantom.getLogLevel(),
    LOG_LEVEL_INFO,
    'accepts string value "info"'
  );

  phantom.setLogLevel("warn");
  t.equals(
    phantom.getLogLevel(),
    LOG_LEVEL_WARN,
    'accepts string value "warn"'
  );

  phantom.setLogLevel("error");
  t.equals(
    phantom.getLogLevel(),
    LOG_LEVEL_ERROR,
    'accepts string value "error"'
  );

  phantom.setLogLevel("silent");
  t.equals(
    phantom.getLogLevel(),
    LOG_LEVEL_SILENT,
    'accepts string value "error"'
  );

  phantom.setLogLevel(LOG_LEVEL_TRACE);
  t.equals(
    phantom.getLogLevel(),
    LOG_LEVEL_TRACE,
    "accepts numeric value LOG_LEVEL_TRACE"
  );

  phantom.setLogLevel(LOG_LEVEL_DEBUG);
  t.equals(
    phantom.getLogLevel(),
    LOG_LEVEL_DEBUG,
    "accepts numeric value LOG_LEVEL_DEBUG"
  );

  phantom.setLogLevel(LOG_LEVEL_INFO);
  t.equals(
    phantom.getLogLevel(),
    LOG_LEVEL_INFO,
    "accepts numeric value LOG_LEVEL_INFO"
  );

  phantom.setLogLevel(LOG_LEVEL_WARN);
  t.equals(
    phantom.getLogLevel(),
    LOG_LEVEL_WARN,
    "accepts numeric value LOG_LEVEL_WARN"
  );

  phantom.setLogLevel(LOG_LEVEL_ERROR);
  t.equals(
    phantom.getLogLevel(),
    LOG_LEVEL_ERROR,
    "accepts numeric value LOG_LEVEL_ERROR"
  );

  phantom.setLogLevel(LOG_LEVEL_SILENT);
  t.equals(
    phantom.getLogLevel(),
    LOG_LEVEL_SILENT,
    "accepts numeric value LOG_LEVEL_SILENT"
  );

  t.end();
});

test("PhantomCore this.log and this.logger calls", t => {
  t.plan(8);

  const phantom = new PhantomCore();

  // phantom.log and phantom.logger can be called independently and are treated
  // the same for all usages except that calling phantom.log() directly will
  // indirectly call logger.info

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

  t.end();
});

test("independent logger", t => {
  t.plan(4);

  logger.log("ok");
  t.ok(true, "call to logger.log() succeeds");

  logger.log.debug("ok");
  logger.debug("ok");
  t.ok(true, "call to logger.debug() succeeds");

  logger.log.warn("ok");
  logger.warn("ok");
  t.ok(true, "call to logger.warn() succeeds");

  logger.log.error("ok");
  logger.error("ok");
  t.ok(true, "call to logger.ok() succeeds");

  t.end();
});

/*
test("custom logger", t => {
  t.plan(7);

  const phantom = new PhantomCore({
    logger: {
      trace: () => {
        throw new Error("trace");
      },
      debug: () => {
        throw new Error("debug");
      },
      info: () => {
        throw new Error("info");
      },
      warn: () => {
        throw new Error("warn");
      },
      error: () => {
        throw new Error("error");
      },
      setLevel: level => (this._level = level),
      getLevel: () => this._level,
    },
  });

  phantom.setLogLevel(LOG_LEVEL_TRACE);

  try {
    phantom.log("This should throw");
  } catch (err) {
    t.equals(err.message, "info", "direct call to log aliases to log.info()");
  }

  try {
    phantom.log.trace("This should throw");
  } catch (err) {
    t.equals(err.message, "trace", "throws at log.trace()");
  }

  try {
    phantom.log.debug("This should throw");
  } catch (err) {
    t.equals(err.message, "debug", "throws at log.debug()");
  }

  try {
    phantom.log.info("This should throw");
  } catch (err) {
    t.equals(err.message, "info", "throws at log.info()");
  }

  try {
    phantom.log.warn("This should throw");
  } catch (err) {
    t.equals(err.message, "warn", "throws at log.warn()");
  }

  try {
    phantom.log.error("This should throw");
  } catch (err) {
    t.equals(err.message, "error", "throws at log.error()");
  }

  phantom.setLogLevel(LOG_LEVEL_ERROR);

  try {
    phantom.log.warn("This should not execute");
  } catch (err) {
    throw new Error("Should not get here");
  } finally {
    t.equals(
      phantom.getLogLevel(),
      LOG_LEVEL_ERROR,
      "does not call log.warn() when log level is LOG_LEVEL_ERROR"
    );
  }

  phantom.destroy();

  t.end();
});
*/
