import { useSyncExternalStore } from 'react';

type Listener<T> = (state: T) => any;
type UpdateFn<T> = (updater: Partial<T> | ((prev: T) => Partial<T>)) => void;

const isObject = (obj: any) => obj?.constructor === Object;

export const createFlowState = <T>(init: T) => {
  let state = init;
  const listeners = new Set<Listener<T>>();
  const getState = () => state;
  const getInit = () => init;

  const update = (partial: Partial<T> | ((prev: T) => Partial<T>)) => {
    let next: T;

    if (typeof partial === 'function') {
      const result = partial(state);
      if (isObject(result) && isObject(state)) next = { ...state, ...result };
      else next = result as T;
    } else if (isObject(state) && isObject(partial)) {
      next = { ...state, ...partial };
    } else {
      next = partial as T; // non object replacement.
    }

    if (next !== state) {
      state = next;
      listeners.forEach((l) => l(state));
    }
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

  const useFlowState = () => useFlowSelector((s) => s);

  return {
    useFlowSelector,
    useFlowState,
    update,
    getState,
    getInit,
    subscribe,
  };
};
