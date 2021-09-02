const uuidv4 = require("uuid").v4;

// TODO: Document
const symbolToUUID = (() => {
  const symbolMap = new Map();

  return function (symbol) {
    if (!(typeof symbol === "symbol")) {
      throw new TypeError("symbol is not a Symbol");
    }

    const prev = symbolMap.get(symbol);

    if (prev) {
      return prev;
    } else {
      const next = uuidv4();

      symbolMap.set(symbol, next);

      return next;
    }
  };
})();

module.exports = symbolToUUID;
