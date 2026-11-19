import { StateStore } from '@stream-io/state-store';
import type { SearchSourceState } from 'stream-chat';

/**
 * A search source with a real state store and spied methods, standing in for the stream-chat
 * search sources the channel detail views create. Kept free of runtime `stream-chat` imports, so a
 * `vi.mock('stream-chat')` factory can import it.
 */
export const createFakeSearchSource = (
  type: string,
  initialState: Partial<SearchSourceState> = {},
) => {
  const state = new StateStore<SearchSourceState>({
    hasNext: true,
    isActive: true,
    isLoading: false,
    items: undefined,
    lastQueryError: undefined,
    next: undefined,
    offset: 0,
    searchQuery: '',
    ...initialState,
  });

  return {
    activate: vi.fn(),
    cancelScheduledQuery: vi.fn(),
    executeQuery: vi.fn(() => Promise.resolve()),
    get isLoading() {
      return state.getLatestValue().isLoading;
    },
    get items() {
      return state.getLatestValue().items;
    },
    get lastQueryError() {
      return state.getLatestValue().lastQueryError;
    },
    resetState: vi.fn(),
    search: vi.fn(),
    get searchQuery() {
      return state.getLatestValue().searchQuery;
    },
    state,
    type,
  };
};

export type FakeSearchSource = ReturnType<typeof createFakeSearchSource>;

/** The fake sources the mocked stream-chat search source classes created, newest last. */
export const createdFakeSearchSources: FakeSearchSource[] = [];

/** A class whose instances are fake search sources of `type`, for `vi.mock('stream-chat')`. */
export const createFakeSearchSourceClass = (type: string) =>
  function FakeSearchSourceClass() {
    const source = createFakeSearchSource(type);
    createdFakeSearchSources.push(source);
    return source;
  } as unknown as new (...args: unknown[]) => FakeSearchSource;
