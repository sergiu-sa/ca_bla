/**
 * @file throttle.ts
 * @description Utility function to throttle the execution of a given function.
 * This is useful for optimizing performance by limiting the rate at which a function can be called.
 * @note This code is taken from a boiler-plate created by Monde Sineke
 * @author Your Name
 */

interface ThrottleArgs extends Array<any> {}

/**
 * Creates a throttled function that only invokes `func` at most once per
 * every `limit` milliseconds.
 * @param {Function} func The function to throttle.
 * @param {number} limit The number of milliseconds to throttle invocations to.
 * @returns {Function} Returns the new throttled function.
 * @example
 * ```
 * // Wrap our scroll handler in the throttle utility. 
// We'll execute it at most once every 250ms. 
const throttledScroll = throttle(() => console.log("Yo")), 250); 
 
window.addEventListener('scroll', throttledScroll); 
```
 */
export function throttle(func: (...args: any[]) => void, limit = 250) {
  let shouldWait = false;
  let waitingArgs: ThrottleArgs | null;

  const timeoutFunc = function (this: any) {
    if (waitingArgs == null) {
      shouldWait = false;
    } else {
      func.apply(this, waitingArgs);
      waitingArgs = null;
      setTimeout(timeoutFunc.bind(this), limit);
    }
  };

  return function (this: any, ...args: any[]) {
    if (shouldWait) {
      waitingArgs = args;
      return;
    }

    func.apply(this, args);
    shouldWait = true;

    setTimeout(timeoutFunc.bind(this), limit);
  };
}
