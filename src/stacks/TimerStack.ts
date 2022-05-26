import assert from "assert";
import _DestructibleEventEmitter from "../_DestructibleEventEmitter";

enum TimerType {
  INTERVAL,
  TIMEOUT,
}

// TODO: Document
// Contains two internal stacks (timeout and interval)
export default class TimerStack extends _DestructibleEventEmitter {
  protected _timeoutStack: ReturnType<typeof setTimeout>[] = [];
  protected _intervalStack: ReturnType<typeof setInterval>[] = [];

  /**
   * Handles the registering of the given callback handler with the relevant
   * global timer type, as well as registering the timer with the relevant
   * local stack.
   */
  protected _setTimerOfType(
    timerType: TimerType,
    fn: Function,
    delay: number = 0
  ) {
    if (timerType === TimerType.TIMEOUT) {
      // Note: The global setTimeout is overridden in order to automatically clear it from the local stack on exit
      const timeoutID: ReturnType<typeof setTimeout> = global.setTimeout(() => {
        // Remove from timeout stack
        this.clearTimeout(timeoutID);

        // Execute the callback handler
        fn();
      }, delay);

      // Add to timeout stack
      this._timeoutStack.push(timeoutID);

      return timeoutID;
    } else {
      const intervalID: ReturnType<typeof setInterval> = global.setInterval(
        fn,
        delay
      ) as unknown as ReturnType<typeof setInterval>;
      // Add to interval stack
      this._intervalStack.push(intervalID);

      return intervalID;
    }
  }

  /**
   * Clears all associated timeouts and intervals managed by this instance.
   */
  clearAllTimers() {
    this.clearAllTimeouts();
    this.clearAllIntervals();
  }

  /**
   * Creates a timeout which is managed by this instance.
   */
  setTimeout(fn: Function, delay = 0) {
    return this._setTimerOfType(TimerType.TIMEOUT, fn, delay);
  }

  /**
   * Mainly utilized for testing and debugging.
   */
  getTimeoutStack() {
    return this._timeoutStack;
  }

  /**
   * Clears the given timeout managed by this instance.
   */
  clearTimeout(timeoutID: ReturnType<typeof setTimeout>) {
    this._timeoutStack = this._timeoutStack.filter(pred => pred !== timeoutID);

    global.clearTimeout(timeoutID);
  }

  /**
   * Clears all registered timeouts managed by this instance.
   */
  clearAllTimeouts() {
    do {
      this.clearTimeout(this._timeoutStack[0]);
    } while (this._timeoutStack.length);
  }

  /**
   * Creates an interval which is managed by this instance.
   */
  setInterval(fn: Function, delay = 0) {
    return this._setTimerOfType(TimerType.INTERVAL, fn, delay);
  }

  /**
   * Mainly utilized for testing and debugging.
   */
  getIntervalStack() {
    return this._intervalStack;
  }

  /**
   * Clears an interval which is managed by this instance.
   */
  clearInterval(intervalID: ReturnType<typeof setInterval>) {
    this._intervalStack = this._intervalStack.filter(
      pred => pred !== intervalID
    );

    global.clearTimeout(intervalID);
  }

  /**
   * Clears all intervals managed by this instance.
   */
  clearAllIntervals() {
    for (const intervalID of this._intervalStack) {
      this.clearInterval(intervalID);
    }
  }

  override async destroy() {
    return super.destroy(() => {
      this.clearAllTimers();

      assert.deepEqual(this._timeoutStack.length, 0);
      assert.deepEqual(this._intervalStack.length, 0);
    });
  }
}
