/**
 * Registers an array of functions, which can be executed synchronously
 * (regardless if they are promises) by using the exec command.
 */
module.exports = class Stack {
  constructor() {
    this._fns = [];
  }

  /**
   * Adds a new function to the stack.
   *
   * @param {function} fn
   * @return {void}
   */
  push(fn) {
    if (typeof fn !== "function") {
      throw new Error("fn must be a function");
    }

    this._fns.push(fn);
  }

  /**
   * Execute all of the functions pushed to the stack until, one at a time,
   * FIFO (first in, first out), until there are no remaining functions to
   * execute.
   *
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
