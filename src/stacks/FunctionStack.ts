// TODO: [3.0.0] Export as enum
export const FUNCTION_STACK_OPS_ORDER_FIFO = "FIFO";
export const FUNCTION_STACK_OPS_ORDER_LIFO = "LIFO";

/**
 * Registers an array of functions, which will run one after the other
 * (regardless if they are promises) by using the exec command.
 */
export default class FunctionStack {
  protected _opsOrder: string;
  // TODO: [3.0.0] Use different type
  protected _fns: Function[] = [];
  protected _isExecuting: boolean = false;

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
  }

  /**
   * Retrieves the order in which the stack elements will execute.
   */
  getOpsOrder(): string {
    return this._opsOrder;
  }

  /**
   * Adds a new function to the stack.
   */
  // TODO: [3.0.0] Use different type
  push(fn: Function): void {
    if (typeof fn !== "function") {
      throw new TypeError("fn must be a function");
    }

    // Ensure a duplicate function is not pushed to the stack
    this._fns = [...new Set([...this._fns, fn])];
  }

  /**
   * Removes the given function from the stack.
   */
  // TODO: [3.0.0] Use different type
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
   */
  getQueueDepth(): number {
    return this._fns.length;
  }

  getIsExecuting(): boolean {
    return this._isExecuting;
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
    if (this._isExecuting) {
      return;
    }

    this._isExecuting = true;

    do {
      // Obtain the first function of the array, and resize the array
      const fn =
        this._opsOrder === FUNCTION_STACK_OPS_ORDER_FIFO
          ? this._fns.shift()
          : this._fns.pop();

      if (typeof fn === "function") {
        await fn();
      }
    } while (this._fns.length);

    this._isExecuting = false;
  }
}
