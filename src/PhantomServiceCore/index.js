const PhantomServiceCore = require("./PhantomServiceCore");
const {
  EVT_UPDATED,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY_STACK_TIMED_OUT,
  EVT_DESTROYED,
} = PhantomServiceCore;

module.exports = PhantomServiceCore;
module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_BEFORE_DESTROY = EVT_BEFORE_DESTROY;
module.exports.EVT_DESTROY_STACK_TIMED_OUT = EVT_DESTROY_STACK_TIMED_OUT;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
