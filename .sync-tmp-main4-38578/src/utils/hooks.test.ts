import { renderHook, act } from '@testing-library/react';
import { useState } from 'react';

describe('useState (React built-in)', () => {
  it('should update value', () => {
    const { result } = renderHook(() => useState(0));
    expect(result.current[0]).toBe(0);
    act(() => {
      result.current[1](5);
    });
    expect(result.current[0]).toBe(5);
  });
});
// Add custom hook tests here as you modularize hooks
