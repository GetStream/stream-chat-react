import { act, renderHook } from '@testing-library/react';
import { StateStore } from '@stream-io/state-store';

import { useStateStore } from '../useStateStore';

type State = {
  count: number;
  items: string[];
  label?: string;
  unrelated: number;
};

const initialState: State = { count: 0, items: ['a'], unrelated: 0 };

const countSelector = (state: State) => ({ count: state.count });
const itemsSelector = (state: State) => state.items;
// Includes `label` only when it is set, so the selection gains or loses a key.
const optionalKeySelector = (state: State) =>
  state.label === undefined
    ? { count: state.count }
    : { count: state.count, label: state.label };

describe('useStateStore', () => {
  it('returns the current selection and follows store changes', () => {
    const store = new StateStore<State>(initialState);
    const { result } = renderHook(() => useStateStore(store, countSelector));

    expect(result.current).toEqual({ count: 0 });

    act(() => store.partialNext({ count: 1 }));

    expect(result.current).toEqual({ count: 1 });
  });

  it('keeps the selection reference while the selected values are unchanged', () => {
    const store = new StateStore<State>(initialState);
    const { rerender, result } = renderHook(() => useStateStore(store, countSelector));
    const first = result.current;

    act(() => store.partialNext({ unrelated: 1 }));
    rerender();

    expect(result.current).toBe(first);
  });

  it('returns a new selection when it gains a key', () => {
    const store = new StateStore<State>(initialState);
    const { result } = renderHook(() => useStateStore(store, optionalKeySelector));

    expect(result.current).toEqual({ count: 0 });

    act(() => store.partialNext({ label: 'new' }));

    expect(result.current).toEqual({ count: 0, label: 'new' });
  });

  it('returns a new selection when it loses a key', () => {
    const store = new StateStore<State>({ ...initialState, label: 'old' });
    const { rerender, result } = renderHook(() =>
      useStateStore(store, optionalKeySelector),
    );

    expect(result.current).toEqual({ count: 0, label: 'old' });

    // The store's own selector comparison does not notify when a key is dropped, so the next
    // render reads the snapshot.
    act(() => store.partialNext({ label: undefined }));
    rerender();

    expect(result.current).toEqual({ count: 0 });
  });

  it('returns a new array selection when the array grows with the same prefix', () => {
    const store = new StateStore<State>(initialState);
    const { result } = renderHook(() => useStateStore(store, itemsSelector));

    expect(result.current).toEqual(['a']);

    act(() => store.partialNext({ items: ['a', 'b'] }));

    expect(result.current).toEqual(['a', 'b']);
  });

  it('keeps the array reference when a new array holds the same items', () => {
    const store = new StateStore<State>(initialState);
    const { rerender, result } = renderHook(() => useStateStore(store, itemsSelector));
    const first = result.current;

    act(() => store.partialNext({ items: ['a'] }));
    rerender();

    expect(result.current).toBe(first);
  });

  it('returns undefined without a store', () => {
    const { result } = renderHook(() =>
      useStateStore(undefined as StateStore<State> | undefined, countSelector),
    );

    expect(result.current).toBeUndefined();
  });
});
