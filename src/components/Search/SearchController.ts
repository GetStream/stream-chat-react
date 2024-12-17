import type {
  Channel,
  ChannelFilters,
  MessageFilters,
  MessageResponse,
  SearchMessageSort,
  SearchOptions,
  StreamChat,
  UserFilters,
  UserResponse,
  UserSort,
} from 'stream-chat';
import { StateStore } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';
import debounce from 'lodash.debounce';
import type { DebouncedFunc } from 'lodash';

// eslint-disable-next-line @typescript-eslint/ban-types
export type SearchSourceType = 'channels' | 'users' | 'messages' | (string & {});
export type QueryReturnValue<T> = { items: T[]; next?: string };

type DebouncedExecQueryFunction = DebouncedFunc<(searchString?: string) => Promise<void>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SearchSource<T = any> {
  readonly hasMore: boolean;
  readonly hasResults: boolean;
  readonly isLoading: boolean;
  readonly items: T[] | undefined;
  readonly lastQueryError: Error | undefined;
  // loadMore(): Promise<void>;
  readonly next: string | undefined;
  readonly offset: number | undefined;
  resetState(): void;
  search(text?: string): Promise<void>;
  searchDebounced: DebouncedExecQueryFunction;
  readonly searchQuery: string;
  setDebounceOptions(debounceMs: number): void;
  readonly state: StateStore<SearchSourceState<T>>;
  readonly type: SearchSourceType;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SearchSourceState<T = any> = {
  hasMore: boolean;
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
  pageSize?: number;
};

const DEFAULT_SEARCH_SOURCE_OPTIONS: Required<SearchSourceOptions> = {
  debounceMs: 300,
  pageSize: 10,
} as const;

export abstract class BaseSearchSource<T> implements SearchSource<T> {
  state: StateStore<SearchSourceState<T>>;
  protected pageSize: number;
  abstract readonly type: SearchSourceType;
  searchDebounced: DebouncedExecQueryFunction;
  // todo: hold filters, sort, options attributes and allow to change them

  protected constructor(options?: SearchSourceOptions) {
    const finalOptions = { ...DEFAULT_SEARCH_SOURCE_OPTIONS, ...options };
    this.pageSize = finalOptions.pageSize;
    this.state = new StateStore<SearchSourceState<T>>({
      hasMore: true,
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

  setDebounceOptions = (debounceMs: number) => {
    this.searchDebounced = debounce(this.executeQuery, debounceMs);
  };

  async executeQuery(searchQuery?: string) {
    const hasNewSearchQuery = typeof searchQuery !== 'undefined';
    const preventLoadMore =
      (!hasNewSearchQuery && !this.hasMore) ||
      this.isLoading ||
      (!hasNewSearchQuery && !this.searchQuery);
    const preventSearchStart = hasNewSearchQuery && this.isLoading;
    if (preventLoadMore || preventSearchStart) return;

    if (hasNewSearchQuery) {
      this.resetState({ searchQuery });
    } else {
      this.state.partialNext({ isLoading: true });
    }

    const queryToSearch = hasNewSearchQuery ? searchQuery : this.searchQuery;
    const stateUpdate: Partial<SearchSourceState<T>> = {};
    try {
      const results = await this.query(queryToSearch);
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
    }
  }

  async search(searchQuery?: string) {
    await this.searchDebounced(searchQuery);
  }

  resetState(stateOverrides?: Partial<SearchSourceState<T>>) {
    this.state.next({
      hasMore: true,
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

  constructor(client: StreamChat<StreamChatGenerics>, options?: SearchSourceOptions) {
    super(options);
    this.client = client;
  }

  protected async query(searchQuery: string) {
    const filters = {
      $or: [{ id: { $autocomplete: searchQuery } }, { name: { $autocomplete: searchQuery } }],
    } as UserFilters<StreamChatGenerics>;
    const sort = { id: 1 } as UserSort<StreamChatGenerics>;
    const options = { limit: this.pageSize, offset: this.offset };
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

  constructor(client: StreamChat<StreamChatGenerics>, options?: SearchSourceOptions) {
    super(options);
    this.client = client;
  }

  protected async query(searchQuery: string) {
    const filters = {
      members: { $in: [this.client.userID] },
      name: { $autocomplete: searchQuery },
    } as ChannelFilters<StreamChatGenerics>;
    const sort = {};
    const options = { limit: this.pageSize, offset: this.offset };
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

  constructor(client: StreamChat<StreamChatGenerics>, options?: SearchSourceOptions) {
    super(options);
    this.client = client;
  }

  protected async query(searchQuery: string) {
    if (!this.client.userID) return { items: [] };

    const channelFilters: ChannelFilters<StreamChatGenerics> = {
      members: { $in: [this.client.userID] },
    } as ChannelFilters<StreamChatGenerics>;

    const messageFilters: MessageFilters<StreamChatGenerics> = {
      text: searchQuery,
      type: 'regular', // todo: type: 'reply'
    } as MessageFilters<StreamChatGenerics>;

    const sort: SearchMessageSort<StreamChatGenerics> = { created_at: -1 };

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
        } as ChannelFilters<StreamChatGenerics>,
        {
          last_message_at: -1,
        },
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
  queriesInProgress: Array<Sources[number]['type']>;
  searchQuery: string;
  activeSource?: Sources[number];
  // FIXME: focusedMessage should live in a MessageListController class that does not exist yet.
  //  This state prop should be then removed
  focusedMessage?: MessageResponse<StreamChatGenerics>;
  input?: HTMLInputElement;
};

export type SearchControllerOptions<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
> = {
  sources?: Sources;
};

// Helper type to create a record from an array of SearchSources
export type SearchSourceRecord<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
> = {
  [K in Sources[number]['type']]: Extract<Sources[number], { type: K }>;
};

export class SearchController<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
> {
  sources: SearchSourceRecord<StreamChatGenerics, Sources> = {} as SearchSourceRecord<
    StreamChatGenerics,
    Sources
  >;
  state: StateStore<SearchControllerState<StreamChatGenerics, Sources>>;

  constructor({ sources }: SearchControllerOptions<StreamChatGenerics, Sources> = {}) {
    this.state = new StateStore<SearchControllerState<StreamChatGenerics, Sources>>({
      isActive: false,
      queriesInProgress: [],
      searchQuery: '',
    });
    sources?.forEach((source) => this.addSource(source));
  }
  get hasMore() {
    return Object.values(this.sources).some((source) => (source as Sources[number]).hasMore);
  }

  get activeSource() {
    return this.state.getLatestValue().activeSource;
  }

  get isActive() {
    return this.state.getLatestValue().isActive;
  }

  get queriesInProgress() {
    return this.state.getLatestValue().queriesInProgress;
  }

  get searchQuery() {
    return this.state.getLatestValue().searchQuery;
  }

  get searchSourceTypes(): Array<Sources[number]['type']> {
    return Object.keys(this.sources) as Sources[number]['type'][];
  }

  get isLoading() {
    return this.state.getLatestValue().queriesInProgress.length > 0;
  }

  get searchedSources() {
    return this.activeSource
      ? [this.activeSource]
      : (Object.values(this.sources) as Sources[number][]);
  }

  isLoadingSource = (sourceType: Sources[number]['type']) =>
    this.queriesInProgress.findIndex((s) => s === sourceType) > -1;

  setInputElement = (input: HTMLInputElement) => {
    this.state.partialNext({ input });
  };

  addSource = (source: Sources[number]) => {
    const sourceType = source.type;
    this.sources = {
      ...this.sources,
      [sourceType]: source,
    } as SearchSourceRecord<StreamChatGenerics, Sources>;
  };

  setActiveSource = (
    sourceType: Sources[number]['type'] | undefined,
    sourceStateOverride?: Partial<SearchSourceState>,
  ) => {
    const activeSource = sourceType && this.sources[sourceType];
    this.state.partialNext({ activeSource });
    if (sourceStateOverride) {
      activeSource?.state.partialNext(sourceStateOverride);
    }
  };

  removeSource = (sourceType: Sources[number]['type']) => {
    if (!this.sources[sourceType as keyof SearchSourceRecord<StreamChatGenerics, Sources>]) return;
    const {
      [sourceType as keyof SearchSourceRecord<StreamChatGenerics, Sources>]: _,
      ...rest
    } = this.sources;
    this.sources = rest as SearchSourceRecord<StreamChatGenerics, Sources>;
  };

  activate = () => {
    this.state.partialNext({ isActive: true });
  };

  search = async (searchQuery?: string) => {
    const searchedSources = this.searchedSources;
    this.state.partialNext({
      queriesInProgress: searchedSources.map((s) => s.type),
      searchQuery,
    });
    const activeSource = this.activeSource;
    if (activeSource) {
      Object.values(this.sources).forEach((s) => {
        if ((s as SearchSource).type !== activeSource.type) {
          (s as SearchSource).state.partialNext({ searchQuery });
        }
      });
    }
    await Promise.all(searchedSources.map((source) => source.search(searchQuery)));
    this.state.partialNext({
      queriesInProgress: [],
    });
  };

  cancelSearchQueries = () => {
    this.searchedSources.forEach((s) => s.searchDebounced.cancel());
  };

  resetState = (state?: Partial<SearchControllerState<StreamChatGenerics, Sources>>) => {
    Object.values(this.sources).forEach((source) => (source as Sources[number]).resetState());
    this.state.next((prev) => ({
      ...prev,
      isActive: false,
      queriesInProgress: [],
      searchQuery: '',
      ...state,
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
