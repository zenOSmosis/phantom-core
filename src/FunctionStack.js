/**
 * Registers an array of functions, which will run one after the other
 * (regardless if they are promises) by using the exec command.
 */
module.exports = class FunctionStack {
  constructor() {
    this._fns = [];
  }

  /**
   * Adds a new function to the stack.
   *
   * @param {Function} fn
   * @return {void}
   */
  push(fn) {
    if (typeof fn !== "function") {
      throw new TypeError("fn must be a function");
    }

    // Ensure a duplicate function is not pushed to the stack
    this._fns = [...new Set([...this._fns, fn])];
  }

  /**
   * Removes the given function from the stack.
   *
   * @param {Function} fn
   */
  remove(fn) {
    this._fns = this._fns.filter(pred => pred !== fn);
  }

  /**
   * Removes all functions from the stack.
   *
   * @return {void}
   */
  clear() {
    this._fns = [];
  }

  /**
   * Retrieves the number of callback functions registered at any given time in
   * the stack, waiting to be invoked.
   *
   * Currently invoking functions are not part of this count, as they have
   * already been removed from the queue.
   *
   * @return {number}
   */
  getQueueDepth() {
    return this._fns.length;
  }

  /**
   * Execute all of the functions pushed to the stack until, one at a time,
   * FIFO (first in, first out), until there are no remaining functions to
   * execute.
   *
   * IMPORTANT: This method recursively calls itself until there are not more
   * items in the stack.
   *
   * @return {Promise<void>}
   */
  async exec() {
    if (this._fns.length) {
      // Obtain the first function of the array, and resize the array
      const fn = this._fns.shift();

      await fn();

      // Recursively call itself, executing the next stack index, if exists
      return this.exec();
    }
  }
};
