import { useSyncExternalStore } from 'react';
import { produce } from 'immer';

type Listener<T> = (state: T) => any;
type UpdateFn<T> = (recipe: (draft: T) => void | T) => void;

export const createFlowState = <T>(init: T) => {
  let state = init;
  const listeners = new Set<Listener<T>>();
  const getState = () => state;
  const getInit = () => init;

  const update: UpdateFn<T> = (recipe) => {
    const next = produce(state, recipe);
    if (next !== state) {
      state = next;
      listeners.forEach((l) => l(getState()));
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
