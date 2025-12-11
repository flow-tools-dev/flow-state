import { describe, expect, test, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createFlowState } from '..';

const TestComponent = () => {
  return <div></div>;
};

const store = createFlowState({
  users: [
    { age: 32, name: 'Jimmy Bananas' },
    { age: 18, name: 'Jackie Mangoes' },
  ],
  otherStuff: 'hi',
});

describe('A few tests to get started', () => {
  test('It should maintain referential equality for untouched objects.', () => {
    const { result: fullRes } = renderHook(() => store.useFlowState());
    const { result: otherRes } = renderHook(() =>
      store.useFlowSelector(({ otherStuff }) => otherStuff)
    );
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
    });
  });
});
