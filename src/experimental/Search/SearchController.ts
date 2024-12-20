import { StateStore } from 'stream-chat';
import type {
  Channel,
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  MessageFilters,
  MessageResponse,
  SearchMessageSort,
  SearchOptions,
  StreamChat,
  UserFilters,
  UserOptions,
  UserResponse,
  UserSort,
} from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface DebouncedFunc<T extends (...args: any[]) => any> {
  /**
   * Call the original function, but applying the debounce rules.
   *
   * If the debounced function can be run immediately, this calls it and returns its return
   * value.
   *
   * Otherwise, it returns the return value of the last invocation, or undefined if the debounced
   * function was not invoked yet.
   */
  (...args: Parameters<T>): ReturnType<T> | undefined;

  /**
   * Throw away any pending invocation of the debounced function.
   */
  cancel(): void;

  /**
   * If there is a pending invocation of the debounced function, invoke it immediately and return
   * its return value.
   *
   * Otherwise, return the value from the last invocation, or undefined if the debounced function
   * was never invoked.
   */
  flush(): ReturnType<T> | undefined;
}

// works exactly the same as lodash.debounce
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  timeout = 0,
  { leading = false, trailing = true }: { leading?: boolean; trailing?: boolean } = {},
): DebouncedFunc<T> => {
  let runningTimeout: null | NodeJS.Timeout = null;
  let argsForTrailingExecution: Parameters<T> | null = null;
  let lastResult: ReturnType<T> | undefined;

  const debouncedFn = (...args: Parameters<T>) => {
    if (runningTimeout) {
      clearTimeout(runningTimeout);
    } else if (leading) {
      lastResult = fn(...args);
    }
    if (trailing) argsForTrailingExecution = args;

    const timeoutHandler = () => {
      if (argsForTrailingExecution) {
        lastResult = fn(...argsForTrailingExecution);
        argsForTrailingExecution = null;
      }
      runningTimeout = null;
    };

    runningTimeout = setTimeout(timeoutHandler, timeout);
    return lastResult;
  };

  debouncedFn.cancel = () => {
    if (runningTimeout) clearTimeout(runningTimeout);
  };

  debouncedFn.flush = () => {
    if (runningTimeout) {
      clearTimeout(runningTimeout);
      runningTimeout = null;
      if (argsForTrailingExecution) {
        lastResult = fn(...argsForTrailingExecution);
      }
    }
    return lastResult;
  };
  return debouncedFn;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type SearchSourceType = 'channels' | 'users' | 'messages' | (string & {});
export type QueryReturnValue<T> = { items: T[]; next?: string };
export type DebounceOptions = {
  debounceMs: number;
};
type DebouncedExecQueryFunction = DebouncedFunc<(searchString?: string) => Promise<void>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SearchSource<T = any> {
  activate(sourceStateOverride?: Partial<SearchSourceState>): void;
  deactivate(): void;
  readonly hasMore: boolean;
  readonly hasResults: boolean;
  readonly isActive: boolean;
  readonly isLoading: boolean;
  readonly items: T[] | undefined;
  readonly lastQueryError: Error | undefined;
  readonly next: string | undefined;
  readonly offset: number | undefined;
  resetState(stateOverrides?: Partial<SearchSourceState<T>>): void;
  search(text?: string): Promise<void>;
  searchDebounced: DebouncedExecQueryFunction;
  readonly searchQuery: string;
  setDebounceOptions(options: DebounceOptions): void;
  readonly state: StateStore<SearchSourceState<T>>;
  readonly type: SearchSourceType;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SearchSourceState<T = any> = {
  hasMore: boolean;
  isActive: boolean;
  isLoading: boolean;
  items: T[] | undefined;
  searchQuery: string;
  lastQueryError?: Error;
  next?: string;
  offset?: number;
};

export type SearchSourceOptions = {
  /** The number of milliseconds to debounce the search query. The default interval is 300ms. */
  debounceMs?: number;
  isActive?: boolean;
  pageSize?: number;
};

const DEFAULT_SEARCH_SOURCE_OPTIONS: Required<SearchSourceOptions> = {
  debounceMs: 5000,
  isActive: false,
  pageSize: 10,
} as const;

export abstract class BaseSearchSource<T> implements SearchSource<T> {
  state: StateStore<SearchSourceState<T>>;
  protected pageSize: number;
  abstract readonly type: SearchSourceType;
  searchDebounced: DebouncedExecQueryFunction;
  private resolveDebouncedSearch?: (value?: unknown) => void;

  protected constructor(options?: SearchSourceOptions) {
    const finalOptions = { ...DEFAULT_SEARCH_SOURCE_OPTIONS, ...options };
    this.pageSize = finalOptions.pageSize;
    this.state = new StateStore<SearchSourceState<T>>({
      hasMore: true,
      isActive: finalOptions.isActive,
      isLoading: false,
      items: undefined,
      offset: 0,
      searchQuery: '',
    });
    this.searchDebounced = debounce(this.executeQuery.bind(this), finalOptions.debounceMs);
  }

  get lastQueryError() {
    return this.state.getLatestValue().lastQueryError;
  }

  get hasMore() {
    return this.state.getLatestValue().hasMore;
  }

  get hasResults() {
    return Array.isArray(this.state.getLatestValue().items);
  }

  get isActive() {
    return this.state.getLatestValue().isActive;
  }

  get isLoading() {
    return this.state.getLatestValue().isLoading;
  }

  get items() {
    return this.state.getLatestValue().items;
  }

  get next() {
    return this.state.getLatestValue().next;
  }

  get offset() {
    return this.state.getLatestValue().offset;
  }

  get searchQuery() {
    return this.state.getLatestValue().searchQuery;
  }

  protected abstract query(searchQuery: string): Promise<QueryReturnValue<T>>;

  protected abstract filterQueryResults(items: T[]): T[] | Promise<T[]>;

  setDebounceOptions = ({ debounceMs }: DebounceOptions) => {
    this.searchDebounced = debounce(this.executeQuery, debounceMs);
  };

  activate = (sourceStateOverride?: Partial<SearchSourceState>) => {
    if (this.isActive) return;
    if (this.searchQuery) {
      this.search();
    }
    this.state.partialNext({ ...sourceStateOverride, isActive: true });
  };

  deactivate = () => {
    if (!this.isActive) return;
    this.state.partialNext({ isActive: false });
  };

  async executeQuery(searchQuery: string) {
    const hasNewSearchQuery = typeof searchQuery !== 'undefined';
    if (!this.isActive || this.isLoading || !this.hasMore || !searchQuery) return;

    if (hasNewSearchQuery) {
      this.resetState({ isActive: this.isActive, isLoading: true, searchQuery });
    } else {
      this.state.partialNext({ isLoading: true });
    }

    const stateUpdate: Partial<SearchSourceState<T>> = {};
    try {
      const results = await this.query(searchQuery);
      if (!results) return;
      const { items, next } = results;

      if (next) {
        stateUpdate.next = next;
        stateUpdate.hasMore = !!next;
      } else {
        stateUpdate.offset = (this.offset ?? 0) + items.length;
        stateUpdate.hasMore = items.length === this.pageSize;
      }

      stateUpdate.items = await this.filterQueryResults(items);
    } catch (e) {
      stateUpdate.lastQueryError = e as Error;
    } finally {
      this.state.next(({ lastQueryError, ...prev }: SearchSourceState<T>) => ({
        ...prev,
        ...stateUpdate,
        isLoading: false,
        items: [...(prev.items ?? []), ...(stateUpdate.items || [])],
      }));
      this.resolveDebouncedSearch?.();
    }
  }

  search = async (searchQuery?: string) => {
    await new Promise((resolve) => {
      this.resolveDebouncedSearch = resolve;
      this.searchDebounced(searchQuery ?? this.searchQuery);
    });
  };

  resetState(stateOverrides?: Partial<SearchSourceState<T>>) {
    this.state.next({
      hasMore: true,
      isActive: false,
      isLoading: false,
      items: undefined,
      lastQueryError: undefined,
      next: undefined,
      offset: 0,
      searchQuery: '',
      ...stateOverrides,
    });
  }
}

export class UserSearchSource<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> extends BaseSearchSource<UserResponse<StreamChatGenerics>> {
  readonly type = 'users';
  private client: StreamChat<StreamChatGenerics>;
  filters: UserFilters<StreamChatGenerics> | undefined;
  sort: UserSort<StreamChatGenerics> | undefined;
  searchOptions: Omit<UserOptions, 'limit' | 'offset'> | undefined;

  constructor(client: StreamChat<StreamChatGenerics>, options?: SearchSourceOptions) {
    super(options);
    this.client = client;
  }

  protected async query(searchQuery: string) {
    const filters = {
      $or: [{ id: { $autocomplete: searchQuery } }, { name: { $autocomplete: searchQuery } }],
      ...this.filters,
    } as UserFilters<StreamChatGenerics>;
    const sort = { id: 1, ...this.sort } as UserSort<StreamChatGenerics>;
    const options = { ...this.searchOptions, limit: this.pageSize, offset: this.offset };
    const { users } = await this.client.queryUsers(filters, sort, options);
    return { items: users };
  }

  protected filterQueryResults(items: UserResponse<StreamChatGenerics>[]) {
    return items.filter((u) => u.id !== this.client.user?.id);
  }
}

export class ChannelSearchSource<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> extends BaseSearchSource<Channel<StreamChatGenerics>> {
  readonly type = 'channels';
  private client: StreamChat<StreamChatGenerics>;
  filters: ChannelFilters<StreamChatGenerics> | undefined;
  sort: ChannelSort<StreamChatGenerics> | undefined;
  searchOptions: Omit<ChannelOptions, 'limit' | 'offset'> | undefined;

  constructor(client: StreamChat<StreamChatGenerics>, options?: SearchSourceOptions) {
    super(options);
    this.client = client;
  }

  protected async query(searchQuery: string) {
    const filters = {
      members: { $in: [this.client.userID] },
      name: { $autocomplete: searchQuery },
      ...this.filters,
    } as ChannelFilters<StreamChatGenerics>;
    const sort = this.sort ?? {};
    const options = { ...this.searchOptions, limit: this.pageSize, offset: this.offset };
    const items = await this.client.queryChannels(filters, sort, options);
    return { items };
  }

  protected filterQueryResults(items: Channel<StreamChatGenerics>[]) {
    return items;
  }
}

export class MessageSearchSource<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> extends BaseSearchSource<MessageResponse<StreamChatGenerics>> {
  readonly type = 'messages';
  private client: StreamChat<StreamChatGenerics>;
  messageSearchChannelFilters: ChannelFilters<StreamChatGenerics> | undefined;
  messageSearchFilters: MessageFilters<StreamChatGenerics> | undefined;
  messageSearchSort: SearchMessageSort<StreamChatGenerics> | undefined;
  channelQueryFilters: ChannelFilters<StreamChatGenerics> | undefined;
  channelQuerySort: ChannelSort<StreamChatGenerics> | undefined;
  channelQueryOptions: Omit<ChannelOptions, 'limit' | 'offset'> | undefined;

  constructor(client: StreamChat<StreamChatGenerics>, options?: SearchSourceOptions) {
    super(options);
    this.client = client;
  }

  protected async query(searchQuery: string) {
    if (!this.client.userID) return { items: [] };

    const channelFilters: ChannelFilters<StreamChatGenerics> = {
      members: { $in: [this.client.userID] },
      ...this.messageSearchChannelFilters,
    } as ChannelFilters<StreamChatGenerics>;

    const messageFilters: MessageFilters<StreamChatGenerics> = {
      text: searchQuery,
      type: 'regular', // FIXME: type: 'reply' resp. do not filter by type and allow to jump to a message in a thread - missing support
      ...this.messageSearchFilters,
    } as MessageFilters<StreamChatGenerics>;

    const sort: SearchMessageSort<StreamChatGenerics> = {
      created_at: -1,
      ...this.messageSearchSort,
    };

    const options = {
      limit: this.pageSize,
      next: this.next,
      sort,
    } as SearchOptions<StreamChatGenerics>;

    const { next, results } = await this.client.search(channelFilters, messageFilters, options);
    const items = results.map(({ message }) => message);

    const cids = Array.from(
      items.reduce((acc, message) => {
        if (message.cid && !this.client.activeChannels[message.cid]) acc.add(message.cid);
        return acc;
      }, new Set<string>()), // keep the cids unique
    );
    const allChannelsLoadedLocally = cids.length === 0;
    if (!allChannelsLoadedLocally) {
      await this.client.queryChannels(
        {
          cid: { $in: cids },
          ...this.channelQueryFilters,
        } as ChannelFilters<StreamChatGenerics>,
        {
          last_message_at: -1,
          ...this.channelQuerySort,
        },
        this.channelQueryOptions,
      );
    }

    return { items, next };
  }

  protected filterQueryResults(items: MessageResponse<StreamChatGenerics>[]) {
    return items;
  }
}

export type DefaultSearchSources<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = [
  UserSearchSource<StreamChatGenerics>,
  ChannelSearchSource<StreamChatGenerics>,
  MessageSearchSource<StreamChatGenerics>,
];

/*


The type inference break down for InferSearchQueryResult & SourceItemsRecord:

0. We have defined a value as:
```typescript
let record: SourceItemsRecord<[ChannelByMessageSearchSource]>;
```

1. `Sources[number]` gives us the union of all source types in the array. For example, with `[ChannelByMessageSearchSource]`, it gives us just `ChannelByMessageSearchSource`

2. Then, `Extract<Sources[number], { type: K }>` filters this union to get only the source type that has the matching `type` property value. For example:
```typescript
// When K is 'channelsByMessages'
Extract<ChannelByMessageSearchSource, { type: 'channelsByMessages' }>
// Results in ChannelByMessageSearchSource
```

3. This extracted type becomes the `T` in `InferSearchQueryResult<T>`. So:
```typescript
InferSearchQueryResult<ChannelByMessageSearchSource>
```

4. Then the conditional type checks if `T extends BaseSearchSource<infer U>`:
```typescript
ChannelByMessageSearchSource extends BaseSearchSource<Channel<StreamChatGenerics>>
// true, and U becomes Channel<StreamChatGenerics>
```

5. Finally, we get `Channel<StreamChatGenerics>` as our result type for the array.

So for the example:
```typescript
SourceItemsRecord<[ChannelByMessageSearchSource]>
// Becomes:
{
  channelsByMessages: Array<Channel<StreamChatGenerics>>;
}
```
 */
export type InferSearchQueryResult<T> = T extends BaseSearchSource<infer U> ? U : never;

export type SourceItemsRecord<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
> = {
  [K in Sources[number]['type']]: Array<
    InferSearchQueryResult<Extract<Sources[number], { type: K }>>
  >;
};

export type SearchControllerState<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
> = {
  isActive: boolean;
  searchQuery: string;
  sources: Sources;
  // FIXME: focusedMessage should live in a MessageListController class that does not exist yet.
  //  This state prop should be then removed
  focusedMessage?: MessageResponse<StreamChatGenerics>;
  input?: HTMLInputElement;
};

export type SearchControllerConfig = {
  // The controller will make sure there is always exactly one active source
  keepSingleActiveSource: boolean;
};

export type SearchControllerOptions<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
> = {
  config?: Partial<SearchControllerConfig>;
  sources?: Sources;
};

export class SearchController<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
> {
  state: StateStore<SearchControllerState<StreamChatGenerics, Sources>>;
  config: SearchControllerConfig;

  constructor({ config, sources }: SearchControllerOptions<StreamChatGenerics, Sources> = {}) {
    this.state = new StateStore<SearchControllerState<StreamChatGenerics, Sources>>({
      isActive: false,
      searchQuery: '',
      sources: sources ?? (([] as unknown) as Sources),
    });
    this.config = { keepSingleActiveSource: false, ...config };
  }
  get hasMore() {
    return this.sources.some((source) => (source as Sources[number]).hasMore);
  }

  get sources() {
    return this.state.getLatestValue().sources;
  }

  get activeSources() {
    return this.state.getLatestValue().sources.filter((s) => s.isActive);
  }

  get isActive() {
    return this.state.getLatestValue().isActive;
  }

  get searchQuery() {
    return this.state.getLatestValue().searchQuery;
  }

  get searchSourceTypes(): Array<Sources[number]['type']> {
    return this.sources.map((s) => s.type) as Sources[number]['type'][];
  }

  setInputElement = (input: HTMLInputElement) => {
    this.state.partialNext({ input });
  };

  addSource = (source: Sources[number]) => {
    this.state.partialNext({
      sources: [...this.sources, source] as Sources,
    });
  };

  getSource = (sourceType: Sources[number]['type']) =>
    this.sources.find((s) => s.type === sourceType);

  removeSource = (sourceType: Sources[number]['type']) => {
    const newSources = this.sources.filter((s) => s.type !== sourceType);
    if (newSources.length === this.sources.length) return;
    this.state.partialNext({ sources: newSources as Sources });
  };

  activateSource = (
    sourceType: Sources[number]['type'],
    sourceStateOverride?: Partial<SearchSourceState>,
  ) => {
    const source = this.getSource(sourceType);
    if (!source || source.isActive) return;
    if (this.config.keepSingleActiveSource) {
      this.sources.forEach((s) => {
        if (s.type !== sourceType) {
          s.deactivate();
        }
      });
    }
    source.activate(sourceStateOverride);
    if (this.searchQuery && !source.items?.length) source.search(this.searchQuery);
    this.state.partialNext({ sources: [...this.sources] as Sources });
  };

  deactivateSource = (sourceType: Sources[number]['type']) => {
    const source = this.getSource(sourceType);
    if (!source?.isActive) return;
    if (this.activeSources.length === 1) return;
    source.deactivate();
    this.state.partialNext({ sources: [...this.sources] as Sources });
  };

  setActiveSources = (
    sourceTypes: Array<Sources[number]['type']>,
    sourceStateOverride?: Partial<SearchSourceState>,
  ) => {
    if (sourceTypes.length > 1 && this.config.keepSingleActiveSource) return;
    sourceTypes.forEach((sourceType) => this.getSource(sourceType)?.activate(sourceStateOverride));
    this.state.partialNext({ sources: this.activeSources as Sources });
  };

  activate = () => {
    if (!this.activeSources.length) {
      const sourcesToActivate = this.config.keepSingleActiveSource
        ? this.sources.slice(0, 1)
        : this.sources;
      sourcesToActivate.forEach((s) => s.activate());
    }
    if (this.isActive) return;
    this.state.partialNext({ isActive: true });
  };

  search = async (searchQuery?: string) => {
    const searchedSources = this.activeSources;
    this.state.partialNext({
      searchQuery,
    });
    await Promise.all(searchedSources.map((source) => source.search(searchQuery)));
  };

  cancelSearchQueries = () => {
    this.activeSources.forEach((s) => s.searchDebounced.cancel());
  };

  clear = () => {
    this.cancelSearchQueries();
    this.sources.forEach((source) =>
      (source as Sources[number]).resetState({ isActive: source.isActive }),
    );
    this.state.next((prev) => ({
      ...prev,
      isActive: true,
      queriesInProgress: [],
      searchQuery: '',
    }));
  };

  exit = () => {
    this.cancelSearchQueries();
    this.sources.forEach((source) =>
      (source as Sources[number]).resetState({ isActive: source.isActive }),
    );
    this.state.next((prev) => ({
      ...prev,
      isActive: false,
      queriesInProgress: [],
      searchQuery: '',
    }));
  };
}

// Usage example:
// const controller = new SearchController<
//   [
//     UserSearchSource<DefaultStreamChatGenerics>,
//     ChannelSearchSource<DefaultStreamChatGenerics>,
//     ChannelByMessageSearchSource<DefaultStreamChatGenerics>,
//   ]
// >();
//
// const items = controller.items;
