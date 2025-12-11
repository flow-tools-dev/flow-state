import React, { useEffect } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderHook, act, render, fireEvent } from '@testing-library/react';
import { createFlowStore } from '..';

const init = {
  users: [
    { age: 32, name: 'Jimmy Bananas' },
    { age: 18, name: 'Jackie Mangoes' },
  ],
  otherStuff: 'hi',
  secondOtherStuff: { val: 'yo' },
};

const store = createFlowStore(init);
const { useFlowSelector, useFlowState } = store;

const TestSelector = ({ onEffect }: { onEffect: Function }) => {
  const [stuff, setFullState] = useFlowSelector((s) => s.secondOtherStuff);

  useEffect(() => {
    onEffect(stuff);
  }, [stuff]);

  return (
    <div
      data-testid="test-selector"
      onClick={() =>
        setFullState(({ users }) => {
          return { users: users.map((u) => ({ ...u, age: u.age + 1 })) };
        })
      }
    >
      {stuff.val}
    </div>
  );
};
const TestState = ({ onEffect }: { onEffect: Function }) => {
  const [fullState, setFullState] = useFlowState();

  useEffect(() => {
    onEffect(fullState);
  }, [fullState]);

  return (
    <div
      data-testid="test-state"
      onClick={() =>
        setFullState(({ users }) => {
          return { users: users.map((u) => ({ ...u, age: u.age + 1 })) };
        })
      }
    >
      {fullState.users.map((u) => u.age).join('-')}
    </div>
  );
};

describe('createFlowStore - index.ts', () => {
  beforeEach(() => {
    store.resetState();
    store.unsubscribeAll();
  });
  test('It should initialize state', () => {
    const { result } = renderHook(() => useFlowState());
    expect(result.current[0]).toEqual(init);
  });

  test('It should modify state and shallow merge', () => {
    const { result } = renderHook(() => useFlowState());
    const update = result.current[1];
    act(() => {
      update({ otherStuff: 'hello' });
    });
    const [state] = result.current;
    expect(state.otherStuff).toBe('hello');
    expect(state.users).toStrictEqual(init.users);
  });

  test('It should select a state slice', () => {
    const { result } = renderHook(() => useFlowSelector((s) => s.users));

    const [state] = result.current;
    expect(state).toStrictEqual(init.users);
  });

  test('It should shallow merge a state slice', () => {
    const { result } = renderHook(() => useFlowSelector((s) => s.users));
    const update = result.current[1];
    act(() => {
      update({
        users: [...result.current[0], { age: 99, name: 'Jerry Jalapenos' }],
      });
    });
    const [state] = result.current;
    expect(state.length).toBe(3);
  });

  test('It should maintain referential equality for untouched objects.', () => {
    const { result: fullRes } = renderHook(() => useFlowState());
    const [fullState] = fullRes.current;
    const { users } = fullState;
    const [jimmy] = users;

    act(() => {
      fullRes.current[1]({ otherStuff: 'meh' });
    });

    expect(jimmy).toStrictEqual(fullRes.current[0].users[0]);
    expect(fullRes.current[0]).toEqual({
      users: [
        { age: 32, name: 'Jimmy Bananas' },
        { age: 18, name: 'Jackie Mangoes' },
      ],
      otherStuff: 'meh',
      secondOtherStuff: { val: 'yo' },
    });
  });
});

describe('Component testing', () => {
  const mock = vi.fn();
  beforeEach(() => {
    store.resetState();
    vi.resetAllMocks();
    store.unsubscribeAll();
  });

  test('Should render the components with state.', () => {
    const screen = render(<TestState onEffect={mock} />);
    const comp = screen.getByTestId('test-state');
    expect(comp.textContent).toBe('32-18');
    screen.unmount();
  });

  test('Should render the components with new state.', () => {
    const screen = render(<TestState onEffect={mock} />);
    const comp = screen.getByTestId('test-state');
    fireEvent.click(comp);
    expect(comp.textContent).toBe('33-19');
    screen.unmount();
  });

  test('Should not re-render if slice state has not changed.', () => {
    const screen = render(<TestSelector onEffect={mock} />);
    const comp = screen.getByTestId('test-selector');
    expect(mock).toHaveBeenCalled();
    mock.mockReset();
    expect(mock).not.toHaveBeenCalled();
    act(() => {
      store.update({ users: [] });
    });
    expect(mock).not.toHaveBeenCalled();
    act(() => {
      store.update({ secondOtherStuff: { val: 'lol' } });
    });
    expect(mock).toHaveBeenCalled();

    expect(store.getState().users).toEqual([]);
    screen.unmount();
  });
});

describe('subscribe/unsubscribe', () => {
  const mock = vi.fn();
  beforeEach(() => {
    store.resetState();
    vi.resetAllMocks();
    store.unsubscribeAll();
  });

  test('subscribes and calls a given listener', () => {
    const unsub = store.subscribe(mock);
    expect(store.getState().users).toHaveLength(2);
    store.update({ users: [] });
    expect(mock).toHaveBeenCalledWith(expect.objectContaining({ users: [] }));
    unsub();
    mock.mockReset();
    store.update({ users: [{ age: 1, name: 'yo' }] });
    expect(mock).not.toHaveBeenCalled();
  });

  test('unsubscribeAll', () => {
    const mock1 = vi.fn();
    const mock2 = vi.fn();
    const mocks = [mock1, mock2];
    mocks.forEach((m) => store.subscribe(m));
    store.notify();
    mocks.forEach((m) => expect(m).toHaveBeenCalled());
    mocks.forEach((m) => m.mockReset());
    store.unsubscribeAll();
    store.notify();
    mocks.forEach((m) => expect(m).not.toHaveBeenCalled());
  });
});
describe('Miscellaneous', () => {
  const mock = vi.fn();
  beforeEach(() => {
    store.resetState();
    vi.resetAllMocks();
    store.unsubscribeAll();
  });

  test('Can handle quick updates decoupled', () => {
    store.update({ users: [] });
    store.update({ otherStuff: 'HA!' });
    expect(store.getState().otherStuff).toBe('HA!');
    expect(store.getState().users).toEqual([]);
    expect(store.getState().secondOtherStuff.val).toBe('yo');
  });
  test('Can handle quick updates decoupled in a component.', () => {
    const TwoComps = () => {
      return (
        <>
          <TestState onEffect={vi.fn()} />
          <TestState onEffect={vi.fn()} />
        </>
      );
    };
    const screen = render(<TwoComps />);
    const comps = screen.getAllByTestId('test-state');
    comps.forEach((c) => expect(c.textContent).toBe('32-18'));
    act(() => {
      comps.forEach((c) => c.click());
    });
    comps.forEach((c) => expect(c.textContent).toBe('34-20'));
    screen.unmount();
  });

  test('Can update state from middleware', () => {
    const screen = render(<TestState onEffect={vi.fn()} />);
    const comp = screen.getByTestId('test-state');
    expect(comp.textContent).toBe('32-18');
    act(() => {
      store.update({
        users: store.getState().users.map((u) => ({ ...u, age: u.age + 1 })),
      });
    });
    expect(comp.textContent).toBe('33-19');
    act(() => {
      store.update({
        users: store.getState().users.map((u) => ({ ...u, age: u.age + 1 })),
      });
    });
    act(() => {
      store.update({
        users: store.getState().users.map((u) => ({ ...u, age: u.age + 1 })),
      });
    });
    expect(comp.textContent).toBe('35-21');
    screen.unmount();
  });
});
