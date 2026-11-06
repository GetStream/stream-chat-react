import { renderHook } from '@testing-library/react';

import { useSameValuesReference } from '../useSameValuesReference';

const renderValue = <T>(initialValue: T) =>
  renderHook(({ value }) => useSameValuesReference(value), {
    initialProps: { value: initialValue },
  });

describe('useSameValuesReference', () => {
  it('returns the first value on the first render', () => {
    const value = { a: 1 };
    const { result } = renderValue(value);

    expect(result.current).toBe(value);
  });

  it('keeps the reference while new objects hold the same nested values', () => {
    const { rerender, result } = renderValue({ a: { b: [1, { c: 'x' }] } });
    const first = result.current;

    rerender({ value: { a: { b: [1, { c: 'x' }] } } });

    expect(result.current).toBe(first);
  });

  it('returns the new value when a nested value changes, and keeps that one afterwards', () => {
    const { rerender, result } = renderValue({ a: { b: 1 } });
    const changed = { a: { b: 2 } };

    rerender({ value: changed });
    expect(result.current).toBe(changed);

    rerender({ value: { a: { b: 2 } } });
    expect(result.current).toBe(changed);
  });

  it('compares arrays by length and items', () => {
    const { rerender, result } = renderValue([1, 2]);
    const first = result.current;

    rerender({ value: [1, 2] });
    expect(result.current).toBe(first);

    const longer = [1, 2, 3];
    rerender({ value: longer });
    expect(result.current).toBe(longer);
  });

  it('compares functions by identity', () => {
    const fn = () => null;
    const { rerender, result } = renderValue({ fn });
    const first = result.current;

    rerender({ value: { fn } });
    expect(result.current).toBe(first);

    const other = { fn: () => null };
    rerender({ value: other });
    expect(result.current).toBe(other);
  });

  it('compares class instances and dates by identity', () => {
    const { rerender, result } = renderValue({ at: new Date(0) });

    const sameTime = { at: new Date(0) };
    rerender({ value: sameTime });

    expect(result.current).toBe(sameTime);
  });

  it('treats a key set to undefined as different from a missing key', () => {
    const { rerender, result } = renderValue<{ a?: number }>({});

    const withUndefined = { a: undefined };
    rerender({ value: withUndefined });

    expect(result.current).toBe(withUndefined);
  });

  it('passes primitives through', () => {
    const { rerender, result } = renderValue<number | string>(1);

    rerender({ value: 'one' });

    expect(result.current).toBe('one');
  });

  it('ends the comparison for cyclic values', () => {
    type Node = { name: string; self?: Node };
    const cyclic = (name: string) => {
      const node: Node = { name };
      node.self = node;
      return node;
    };
    const { rerender, result } = renderValue(cyclic('a'));
    const first = result.current;

    rerender({ value: cyclic('a') });
    expect(result.current).toBe(first);

    const other = cyclic('b');
    rerender({ value: other });
    expect(result.current).toBe(other);
  });
});
