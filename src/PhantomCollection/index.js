const PhantomCollection = require("./PhantomCollection");
const {
  EVT_UPDATED,
  EVT_BEFORE_DESTROY,
  EVT_DESTROYED,
  EVT_CHILD_INSTANCE_ADDED,
  EVT_CHILD_INSTANCE_REMOVED,
} = PhantomCollection;

module.exports = PhantomCollection;

module.exports.EVT_CHILD_INSTANCE_ADDED = EVT_CHILD_INSTANCE_ADDED;
module.exports.EVT_CHILD_INSTANCE_REMOVED = EVT_CHILD_INSTANCE_REMOVED;

module.exports.EVT_UPDATED = EVT_UPDATED;
module.exports.EVT_BEFORE_DESTROY = EVT_BEFORE_DESTROY;
module.exports.EVT_DESTROYED = EVT_DESTROYED;
