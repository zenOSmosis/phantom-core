module.exports = class Stack {
  constructor() {
    this._fns = [];
  }

  /**
   * Adds a new function to the stack.
   *
   * @param {function} fn
   */
  push(fn) {
    if (typeof fn !== "function") {
      throw new Error("fn must be a function");
    }

    this._fns.push(fn);
  }

  /**
   * @return {Promise<void>}
   */
  async exec() {
    if (this._fns.length) {
      // Obtain the first function of the array, and resize the array
      const fn = this._fns.shift();

      await fn();

      return this.exec();
    }
  }
};
