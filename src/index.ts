import { useSyncExternalStore } from 'react';

type Listener<T> = (state: T) => any;
type UpdateFn<T> = (
  updater: Partial<T> | ((prev: T) => Partial<T>),
  replace?: boolean
) => void;

const isObject = (obj: any): obj is Object => obj?.constructor === Object;
const isFunction = (v: any): v is Function => typeof v === 'function';
const identity = <T>(v: T): T => v;

export const createFlowState = <T>(init: T) => {
  let state = init;
  const listeners = new Set<Listener<T>>();
  const getState = () => state;
  const setState = (next: T) => (state = next);
  const getInit = () => init;

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

  const notify = (s = getState()) => {
    listeners.forEach((l) => l(s));
  };

  const subscribe = (listener: Listener<T>) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const useFlowSelector = <U>(selector: (state: T) => U): [U, UpdateFn<T>] => {
    const slice = useSyncExternalStore(
      subscribe,
      () => selector(getState()),
      () => selector(getState())
    );
    return [slice, update];
  };

  const useFlowState = () => useFlowSelector(identity);

  return {
    useFlowSelector,
    useFlowState,
    update,
    getState,
    getInit,
    subscribe,
    notify,
  };
};
