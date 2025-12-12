import { useSyncExternalStore } from 'react';

type Listener<T> = (state: T) => any;
type UpdateFn<T> = (
  updater: Partial<T> | ((prev: T) => Partial<T>),
  replace?: boolean
) => void;

const isObject = (obj: any): obj is Object => obj?.constructor === Object;
const isFunction = (v: any): v is Function => typeof v === 'function';
const identity = <T>(v: T): T => v;

/**
 * Creates a Flow State store with hooks and update methods.
 * @template T - Type of state
 * @param init - Initial state
 */
export const createFlowStore = <T>(init: T) => {
  let state = init;
  const listeners = new Set<Listener<T>>();
  /**
   * Gets the current state.
   * @returns The current Flow State
   */
  const getState = () => state;
  /**
   * Sets the Flow State directly.
   * @param next - New state
   */
  const setState = (next: T) => (state = next);
  /**
   * Gets the initial Flow State passed at store creation.
   * @returns The initial Flow State
   */
  const getInit = () => init;
  /**
   * Resets the Flow State to the initial state at store creation.
   */
  const resetState = () => update(getInit(), true);
  /**
   * Updates the Flow State.
   * Can accept a partial object or a function that returns a partial object.
   * Optionally replaces state completely.
   * @param partialOrFn - Partial state object or updater function that can return a partial state object.
   * @param replace - If true, replaces state instead of shallow merging
   */
  const update = (
    partial: Partial<T> | ((prev: T) => Partial<T>),
    replace: boolean = false
  ) => {
    const prev = getState();
    const result = isFunction(partial) ? partial(prev) : partial;
    const next =
      !replace && [result, prev].every(isObject)
        ? ({ ...prev, ...result } as T)
        : (result as T);

    if (next !== state) {
      setState(next);
      notify(next);
    }
  };
  /**
   * Notify all listeners of current state.
   */
  const notify = (s = getState()) => {
    listeners.forEach((l) => l(s));
  };

  /**
   * Subscribe to Flow State changes.
   * @param listener - Function to call when state changes
   * @returns Function to unsubscribe this listener
   */
  const subscribe = (listener: Listener<T>) => {
    listeners.add(listener);
    return () => unsubscribe(listener);
  };
  /**
   * Unsubscribes a listener from the Flow State.
   */
  const unsubscribe = (listener: Listener<T>) => {
    listeners.delete(listener);
  };
  /**
   * Unsubscribes all listeners from the Flow State.
   */
  const unsubscribeAll = () => listeners.forEach(unsubscribe);

  /**
   * Selects a value from Flow State and subscribes the component
   * to changes of only that slice.
   *
   * @example
   * // Select a primitive value
   * const [count, update] = useFlowSelector((s) => s.count);
   * update({ count: count + 1 });
   *
   * @example
   * // Select a nested value
   * const [user, update] = useFlowSelector((s) => s.user);
   * update((prev) => ({ user: { ...prev.user, name: 'New Name' } }));
   *
   * @example
   * // Select multiple fields at once
   * const [profile] = useFlowSelector((s) => ({
   *   name: s.user.name,
   *   description: s.description,
   * }));
   *
   * @template U
   * @param {(state: T) => U} selector - Function that selects a slice of Flow State.
   * @returns {[U, UpdateFn<T>]} - The selected slice and the global update function.
   */
  const useFlowSelector = <U>(selector: (state: T) => U): [U, UpdateFn<T>] => {
    const slice = useSyncExternalStore(
      subscribe,
      () => selector(getState()),
      () => selector(getState())
    );
    return [slice, update];
  };

  /**
   * React hook for subscribing to full Flow State.
   * @returns Tuple of state and the update function
   */
  const useFlowState = () => useFlowSelector(identity);

  return {
    useFlowSelector,
    useFlowState,
    update,
    getState,
    getInit,
    subscribe,
    unsubscribe,
    unsubscribeAll,
    notify,
    resetState,
  };
};
