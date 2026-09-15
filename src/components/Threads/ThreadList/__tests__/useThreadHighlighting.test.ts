import { act, renderHook } from '@testing-library/react';
import { StateStore } from '@stream-io/state-store';
import { fromPartial } from '@total-typescript/shoehorn';

import { useThreadHighlighting } from '../useThreadHighlighting';

import type { Thread, ThreadManager, ThreadManagerState } from 'stream-chat';

/**
 * The flash means "a thread arrived while you were looking at the list".
 *
 * It used to be derived by diffing the threads array by reference, which called anything that
 * merely appeared for the first time an arrival -- so the whole first page lit up on load, and
 * each page did while scrolling.
 */
const thread = (id: string) => fromPartial<Thread>({ id });

const setup = (initial: Partial<ThreadManagerState> = {}) => {
  const state = new StateStore<ThreadManagerState>(
    fromPartial({ threads: [], unseenThreadIds: [], ...initial }),
  );
  const threadManager = fromPartial<ThreadManager>({ state });
  const { result } = renderHook(() => useThreadHighlighting(threadManager));
  return { result, state };
};

describe('useThreadHighlighting', () => {
  it('does not flash the first page arriving on a cold load', () => {
    const { result, state } = setup();

    act(() => state.partialNext({ threads: [thread('a'), thread('b'), thread('c')] }));

    expect(Object.keys(result.current)).toEqual([]);
  });

  it('does not flash a page loaded by pagination', () => {
    const { result, state } = setup({ threads: [thread('a')] });

    act(() => state.partialNext({ threads: [thread('a'), thread('b'), thread('c')] }));

    expect(Object.keys(result.current)).toEqual([]);
  });

  it('flashes a thread the manager reported unseen, once it lands in the list', () => {
    const { result, state } = setup({ threads: [thread('a')] });

    // A message arrives for a thread the list does not hold.
    act(() => state.partialNext({ unseenThreadIds: ['new-one'] }));
    expect(Object.keys(result.current)).toEqual([]);

    // `reload()` brings it in and clears `unseenThreadIds` in the same update -- which is why the
    // id has to have been remembered when it was reported.
    act(() =>
      state.partialNext({
        threads: [thread('new-one'), thread('a')],
        unseenThreadIds: [],
      }),
    );

    expect(Object.keys(result.current)).toEqual(['new-one']);
  });

  it('keeps an earlier flash alive when a second thread arrives', () => {
    const { result, state } = setup({ threads: [thread('a')] });

    act(() => state.partialNext({ unseenThreadIds: ['first'] }));
    act(() =>
      state.partialNext({ threads: [thread('first'), thread('a')], unseenThreadIds: [] }),
    );
    act(() => state.partialNext({ unseenThreadIds: ['second'] }));
    act(() =>
      state.partialNext({
        threads: [thread('second'), thread('first'), thread('a')],
        unseenThreadIds: [],
      }),
    );

    expect(Object.keys(result.current).sort()).toEqual(['first', 'second']);
  });

  it('stops flashing a thread once its reset is called', () => {
    const { result, state } = setup({ threads: [thread('a')] });

    act(() => state.partialNext({ unseenThreadIds: ['new-one'] }));
    act(() =>
      state.partialNext({
        threads: [thread('new-one'), thread('a')],
        unseenThreadIds: [],
      }),
    );

    act(() => result.current['new-one']());

    expect(Object.keys(result.current)).toEqual([]);
  });
});
