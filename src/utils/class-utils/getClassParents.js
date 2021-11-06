const getSuperClass = require("./getSuperClass");

// TODO: Document
module.exports = function getClassInstanceParents(JSClass) {
  const parents = [];

  let predicate = JSClass;
  do {
    predicate = getSuperClass(predicate);

    if (predicate) {
      parents.push(predicate);
    }
  } while (predicate);

  return parents;
};
