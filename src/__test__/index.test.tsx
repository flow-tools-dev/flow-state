import { describe, expect, test, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createFlowState } from '..';

const TestComponent = () => {
  return <div></div>;
};

const store = createFlowState([
  { age: 32, name: 'Jimmy Bananas' },
  { age: 18, name: 'Jackie Mangoes' },
]);

describe('A few tests to get started', () => {
  test('It should maintain referential equality for untouched objects.', () => {
    const { result: fullRes } = renderHook(() => store.useFlowState());
    const { result: countRes } = renderHook(() =>
      store.useFlowSelector((s) => s[1])
    );
    const [originalJackie] = countRes.current;

    act(() => {
      const [, updateArray] = fullRes.current;
      updateArray((draft) => {
        draft[0].name = 'ha!';
      });
    });

    expect(originalJackie).toStrictEqual(fullRes.current[0][1]);
  });
});
