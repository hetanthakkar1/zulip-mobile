/* @flow strict-local */
import invariant from 'invariant';
import { useRef, useEffect, useState } from 'react';

/**
 * A Hook for the value of a prop, state, etc., from the previous render.
 *
 * On first render, returns `initValue`.
 *
 * The second argument `initValue` is optional (even though the type doesn't
 * at first look that way): if omitted, it's `undefined` and the return type
 * is `T | void`.
 *
 * Adapted from
 * https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state,
 * which says, "It’s possible that in the future React will provide a
 * `usePrevious` Hook out of the box since it’s a relatively common
 * use case."
 */
// It's `initValue:`, not `initValue?:`, but initValue is still effectively
// optional because `U` can be void.
//
// If we did write `initValue?:`, we'd get the wrong return type when the
// caller omitted it: there'd be nothing to force `U` to include void
// (because effectively the `?` would handle it instead), and so `U` would
// be the empty type and `T | U` would be just `T`.
export function usePrevious<T, U>(value: T, initValue: U): T | U {
  const ref = useRef<T | U>(initValue);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const NODE_ENV = process.env.NODE_ENV;

/**
 * In debug mode, assert the given value is constant through a component's life.
 *
 * In production mode, do nothing.
 *
 * This is meant to be used as a React Hook.
 */
export function useDebugAssertConstant<T>(value: T) {
  if (NODE_ENV === 'production') {
    return;
  }

  // Conditional, but on a per-process constant.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const origValue = useRef(value);
  invariant(value === origValue.current, '');
}

/**
 * True just when `value` has been true continuously for the past `duration`.
 *
 * When the given time has elapsed so that this hook's return value becomes
 * true, it causes a rerender through a state update.
 *
 * The caller must use a constant `duration` through the lifetime of a given
 * component instance.
 */
export const useHasStayedTrueForMs = (value: boolean, duration: number): boolean => {
  useDebugAssertConstant(duration);

  const [result, setResult] = useState<boolean>(false);

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (value) {
      const id = setTimeout(() => setResult(true), duration);
      return () => clearTimeout(id);
    } else {
      setResult(false);
    }
    // If `duration` changes, we'll tear down the old timeout and start the
    // timer over.  That isn't really ideal behavior... but we don't
    // actually have a use case for a dynamic `duration`, and supporting it
    // properly would be more complex, so we've just forbidden that as part
    // of this hook function's interface.
  }, [value, duration]);

  return result;
};

/**
 * Invoke the callback as an effect when `value` turns from false to true.
 *
 * This differs from putting `value` in a `useEffect` dependency list in
 * that the callback will *not* be invoked when the value changes in the
 * other direction, from true to false.
 *
 * `includeStart` controls what happens if `value` is true on the very first
 * render.  If `includeStart` is true, then the effect is triggered (so
 * treating its previous state of nonexistence as equivalent to being
 * false).  If `includeStart` is false, then the effect is not triggered (so
 * treating its previous state of nonexistence as not a valid state to
 * compare to.)
 *
 * The callback is not permitted to return a cleanup function, because it's
 * not clear what the semantics should be of when such a cleanup function
 * would be run.
 */
export const useEdgeTriggeredEffect = (
  cb: () => void,
  value: boolean,
  includeStart: boolean,
): void => {
  const prev = usePrevious(value, !includeStart);
  useEffect(() => {
    if (value && !prev) {
      cb();
    }
    // No dependencies list -- the effect itself decides whether to act.
  });
};
