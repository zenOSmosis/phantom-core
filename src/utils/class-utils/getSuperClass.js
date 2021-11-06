const getClass = require("./getClass");

// TODO: Document
module.exports = function getSuperClass(classOrInstance) {
  const reservedWord_class = getClass(classOrInstance);

  return Object.getPrototypeOf(reservedWord_class);
};
