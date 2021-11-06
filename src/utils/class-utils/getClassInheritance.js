const getSuperClass = require("./getSuperClass");

/**
 * Retrieves an array of JavaScript classes which form the inheritance of the
 * given instanceOrClass.
 *
 * @param {function | Object} instanceOrClass
 * @return {function[]}
 */
module.exports = function getClassInheritance(instanceOrClass) {
  const parents = [];

  let predicate = instanceOrClass;
  do {
    predicate = getSuperClass(predicate);

    if (predicate) {
      parents.push(predicate);
    }
  } while (predicate);

  return parents;
};
