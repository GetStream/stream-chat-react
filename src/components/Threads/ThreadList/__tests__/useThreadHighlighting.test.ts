import { act, renderHook } from '@testing-library/react';
import { StateStore } from '@stream-io/state-store';
import { fromPartial } from '@total-typescript/shoehorn';

import { useThreadHighlighting } from '../useThreadHighlighting';

import type {
  PaginatorState,
  Thread,
  ThreadManager,
  ThreadManagerState,
} from 'stream-chat';

/**
 * The flash means "a thread arrived while you were looking at the list". Threads that merely
 * appear for the first time (the first page on load, each page while scrolling) are not arrivals.
 */
const thread = (id: string) => fromPartial<Thread>({ id });

const setup = ({ items }: { items?: Thread[] } = {}) => {
  const state = new StateStore<ThreadManagerState>(fromPartial({ unseenThreadIds: [] }));
  const listState = new StateStore<PaginatorState<Thread>>(fromPartial({ items }));
  const threadManager = fromPartial<ThreadManager>({
    paginator: { state: listState },
    state,
  });
  const { result } = renderHook(() => useThreadHighlighting(threadManager));
  return { listState, result, state };
};

describe('useThreadHighlighting', () => {
  it('does not flash the first page arriving on a cold load', () => {
    const { listState, result } = setup();

    act(() => listState.partialNext({ items: [thread('a'), thread('b'), thread('c')] }));

    expect(Object.keys(result.current)).toEqual([]);
  });

  it('does not flash a page loaded by pagination', () => {
    const { listState, result } = setup({ items: [thread('a')] });

    act(() => listState.partialNext({ items: [thread('a'), thread('b'), thread('c')] }));

    expect(Object.keys(result.current)).toEqual([]);
  });

  it('flashes a thread the manager reported unseen, once it lands in the list', () => {
    const { listState, result, state } = setup({ items: [thread('a')] });

    // A message arrives for a thread the list does not hold.
    act(() => state.partialNext({ unseenThreadIds: ['new-one'] }));
    expect(Object.keys(result.current)).toEqual([]);

    // `reload()` brings it into the list, then clears `unseenThreadIds` -- which is why the id has
    // to have been remembered when it was reported.
    act(() => listState.partialNext({ items: [thread('new-one'), thread('a')] }));
    act(() => state.partialNext({ unseenThreadIds: [] }));

    expect(Object.keys(result.current)).toEqual(['new-one']);
  });

  it('flashes the arrival when `unseenThreadIds` is cleared before the list update lands', () => {
    const { listState, result, state } = setup({ items: [thread('a')] });

    act(() => state.partialNext({ unseenThreadIds: ['new-one'] }));
    act(() => state.partialNext({ unseenThreadIds: [] }));
    act(() => listState.partialNext({ items: [thread('new-one'), thread('a')] }));

    expect(Object.keys(result.current)).toEqual(['new-one']);
  });

  it('keeps an earlier flash alive when a second thread arrives', () => {
    const { listState, result, state } = setup({ items: [thread('a')] });

    act(() => state.partialNext({ unseenThreadIds: ['first'] }));
    act(() => listState.partialNext({ items: [thread('first'), thread('a')] }));
    act(() => state.partialNext({ unseenThreadIds: [] }));
    act(() => state.partialNext({ unseenThreadIds: ['second'] }));
    act(() =>
      listState.partialNext({
        items: [thread('second'), thread('first'), thread('a')],
      }),
    );
    act(() => state.partialNext({ unseenThreadIds: [] }));

    expect(Object.keys(result.current).sort()).toEqual(['first', 'second']);
  });

  it('stops flashing a thread once its reset is called', () => {
    const { listState, result, state } = setup({ items: [thread('a')] });

    act(() => state.partialNext({ unseenThreadIds: ['new-one'] }));
    act(() => listState.partialNext({ items: [thread('new-one'), thread('a')] }));
    act(() => state.partialNext({ unseenThreadIds: [] }));

    act(() => result.current['new-one']());

    expect(Object.keys(result.current)).toEqual([]);
  });
});
