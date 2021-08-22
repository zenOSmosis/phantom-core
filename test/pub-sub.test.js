const test = require("tape-async");
const PhantomCore = require("../src");

test("pub-sub", async t => {
  t.plan(6);

  const phantom = new PhantomCore();

  let unsubscriber = null;

  // Used to determine how many times our subscriber has received a message
  let iCount = 0;

  await Promise.all([
    new Promise(resolve => {
      unsubscriber = phantom.subscribe("some-topic", message => {
        ++iCount;

        t.equals(message, "hello world", "message is the correct message");

        t.equals(typeof unsubscriber, "function", "unsubscriber is a function");

        // If we've received more than one message in this topic we throw an error
        if (iCount > 1) {
          throw new Error("Should never reach here");
        }

        resolve();
      });
    }),

    new Promise(resolve => {
      t.doesNotThrow(() => {
        phantom.publish("some-topic", "hello world");
      }, "successfully publishes original message in original topic");

      resolve();
    }),
  ]);

  t.doesNotThrow(() => {
    phantom.publish("some-other-topic", "hello universe");
  }, "successfully publishes message in another topic");

  t.doesNotThrow(unsubscriber, "topic is unsubscribed");

  t.doesNotThrow(() => {
    phantom.publish("some-topic", "hello world");
  }, "successfully publishes subsequent message in original topic");

  t.end();
});
