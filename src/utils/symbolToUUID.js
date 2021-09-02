const uuidv4 = require("uuid").v4;

/**
 * Retrieves the same UUID for same symbols.
 *
 * Useful for using symbol in places where a string or number should be used,
 * instead.
 *
 * @param {Symbol} symbol
 * @return {string} A 36-character string;
 * i.e. "d64e14a5-123b-436a-b168-18c517e3793c"
 */
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
