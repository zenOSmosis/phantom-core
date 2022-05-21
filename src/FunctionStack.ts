export const FUNCTION_STACK_OPS_ORDER_FIFO = "FIFO";
export const FUNCTION_STACK_OPS_ORDER_LIFO = "LIFO";

/**
 * Registers an array of functions, which will run one after the other
 * (regardless if they are promises) by using the exec command.
 */
export default class FunctionStack {
  protected _opsOrder: string;
  // TODO: [3.0.0] This may need to be redefined
  protected _fns: Function[];

  /**
   * @param {FUNCTION_STACK_OPS_ORDER_FIFO | FUNCTION_STACK_OPS_ORDER_LIFO} opsOrder?
   * [default=FUNCTION_STACK_OPS_ORDER_FIFO]
   */
  constructor(opsOrder = FUNCTION_STACK_OPS_ORDER_FIFO) {
    if (
      opsOrder !== FUNCTION_STACK_OPS_ORDER_FIFO &&
      opsOrder !== FUNCTION_STACK_OPS_ORDER_LIFO
    ) {
      throw new ReferenceError('opsOrder must either be "FIFO" or "LIFO"');
    }

    this._opsOrder = opsOrder;

    this._fns = [];
  }

  /**
   * Retrieves the order in which the stack elements will execute.
   *
   * @return {FUNCTION_STACK_OPS_ORDER_FIFO | FUNCTION_STACK_OPS_ORDER_LIFO}
   */
  getOpsOrder() {
    return this._opsOrder;
  }

  /**
   * Adds a new function to the stack.
   */
  push(fn: Function) {
    if (typeof fn !== "function") {
      throw new TypeError("fn must be a function");
    }

    // Ensure a duplicate function is not pushed to the stack
    this._fns = [...new Set([...this._fns, fn])];
  }

  /**
   * Removes the given function from the stack.
   */
  remove(fn: Function) {
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

  // FIXME: (jh) Rename (or alias) to flush
  /**
   * Execute all of the functions pushed to the stack until, one at a time,
   * using either FIFO or LIFO strategy, until there are no remaining functions
   * to execute.
   *
   * IMPORTANT: This method recursively calls itself until there are not more
   * items in the stack.
   */
  async exec(): Promise<void> {
    if (this._fns.length) {
      // Obtain the first function of the array, and resize the array
      const fn =
        this._opsOrder === FUNCTION_STACK_OPS_ORDER_FIFO
          ? this._fns.shift()
          : this._fns.pop();

      await fn();

      // Recursively call itself, executing the next stack index, if exists
      return this.exec();
    }
  }
}
