import assert from "assert";
import _DestructibleEventEmitter, {
  EventListener,
} from "../_DestructibleEventEmitter";

/**
 * Types of timers which are managed by TimerStack.
 */
export enum TimerType {
  Interval,
  Timeout,
}

/**
 * Manages setTimeout and setInterval as if they were non-globals.
 *
 * Why? Forgotten timers and callbacks can make the memory usage of your app go
 * up.
 *
 * Utilized as a module within PhantomCore instances, once an instance is
 * destructed, the attached timers are automatically decommissioned.
 * @see https://felixgerschau.com/javascript-memory-management/#forgotten-timers-and-callbacks
 */
export default class TimerStack extends _DestructibleEventEmitter {
  protected _timeoutStack: NodeJS.Timeout[] = [];
  protected _intervalStack: NodeJS.Timer[] = [];

  /**
   * Handles the registering of the given callback handler with the relevant
   * global timer type, as well as registering the timer with the relevant
   * local stack.
   */
  protected _setTimerOfType(
    timerType: TimerType,
    cb: EventListener,
    delay: number = 0
  ): NodeJS.Timeout {
    if (timerType === TimerType.Timeout) {
      // Note: The global setTimeout is overridden in order to automatically clear it from the local stack on exit
      const timeoutID: NodeJS.Timeout = global.setTimeout(() => {
        // Remove from timeout stack
        this.clearTimeout(timeoutID);

        // Execute the callback handler
        cb();
      }, delay);

      // Add to timeout stack
      this._timeoutStack.push(timeoutID);

      return timeoutID;
    } else {
      const intervalID: NodeJS.Timer = global.setInterval(
        cb,
        delay
      ) as unknown as NodeJS.Timer;

      // Add to interval stack
      this._intervalStack.push(intervalID);

      return intervalID;
    }
  }

  // TODO: [3.0.0] Add optional param1, …, paramN args
  /**
   * Creates a timeout which is managed by this instance.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/setTimeout
   */
  setTimeout(cb: EventListener, delay = 0): NodeJS.Timeout {
    return this._setTimerOfType(TimerType.Timeout, cb, delay);
  }

  /**
   * Mainly utilized for testing and debugging.
   */
  getTimeoutStack(): NodeJS.Timeout[] {
    return this._timeoutStack;
  }

  /**
   * Clears the given timeout, if it is managed by this instance.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/clearTimeout
   */
  clearTimeout(timeoutID: NodeJS.Timeout): void {
    this._timeoutStack = this._timeoutStack.filter(pred => pred !== timeoutID);

    global.clearTimeout(timeoutID);
  }

  /**
   * Clears all timeouts managed by this instance.
   */
  clearAllTimeouts(): void {
    do {
      this.clearTimeout(this._timeoutStack[0]);
    } while (this._timeoutStack.length);
  }

  // TODO: [3.0.0] Add additional arg0, ...argN args
  /**
   * Creates an interval which is managed by this instance.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/setInterval
   */
  setInterval(cb: EventListener, delay = 0): NodeJS.Timer {
    return this._setTimerOfType(TimerType.Interval, cb, delay);
  }

  /**
   * Mainly utilized for testing and debugging.
   */
  getIntervalStack(): NodeJS.Timer[] {
    return this._intervalStack;
  }

  /**
   * Clears an interval which is managed by this instance.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/clearInterval
   */
  clearInterval(intervalID: NodeJS.Timer) {
    this._intervalStack = this._intervalStack.filter(
      pred => pred !== intervalID
    );

    global.clearInterval(intervalID);
  }

  /**
   * Clears all intervals managed by this instance.
   */
  clearAllIntervals(): void {
    for (const intervalID of this._intervalStack) {
      this.clearInterval(intervalID);
    }
  }

  /**
   * Clears all timeouts and intervals managed by this instance.
   */
  clearAllTimers(): void {
    this.clearAllTimeouts();
    this.clearAllIntervals();
  }

  override async destroy(): Promise<void> {
    return super.destroy(() => {
      this.clearAllTimers();

      assert.deepEqual(this._timeoutStack.length, 0);
      assert.deepEqual(this._intervalStack.length, 0);
    });
  }
}
