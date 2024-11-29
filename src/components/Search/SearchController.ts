import { Channel, MessageResponse, StreamChat } from 'stream-chat';
import type {
  // Channel,
  ChannelFilters,
  SearchOptions,
  // StreamChat,
  UserFilters,
  UserResponse,
  UserSort,
} from 'stream-chat';
import { StateStore } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';

// eslint-disable-next-line @typescript-eslint/ban-types
export type SearchSourceType = 'channels' | 'users' | 'channelsByMessages' | (string & {});

export interface SearchSource<T = unknown> {
  readonly hasMore: boolean;
  readonly isLoading: boolean;
  readonly items: T[];
  readonly lastQueryError: Error | undefined;
  loadMore(): Promise<void>;
  readonly next: string | undefined;
  readonly offset: number | undefined;
  resetState(): void;
  search(text: string): Promise<void>;
  readonly searchQuery: string;
  readonly type: SearchSourceType;
}

export type SearchSourceState<T> = {
  hasMore: boolean;
  isLoading: boolean;
  items: T[];
  searchQuery: string;
  lastQueryError?: Error;
  next?: string;
  offset?: number;
};

export type QueryReturnValue<T> = { items: T[]; next?: string };

export abstract class BaseSearchSource<T> implements SearchSource<T> {
  protected state: StateStore<SearchSourceState<T>>;
  protected pageSize: number;
  abstract readonly type: SearchSourceType;
  // todo: hold filters, sort, options attributes and allow to change them

  constructor(pageSize = 8) {
    this.pageSize = pageSize;
    this.state = new StateStore<SearchSourceState<T>>({
      hasMore: true,
      isLoading: false,
      items: [],
      offset: 0,
      searchQuery: '',
    });
  }

  get lastQueryError() {
    return this.state.getLatestValue().lastQueryError;
  }

  get hasMore() {
    return this.state.getLatestValue().hasMore;
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

  protected async executeQuery(searchQuery?: string) {
    const hasNewSearchQuery = typeof searchQuery !== 'undefined';
    const preventLoadMore =
      (!hasNewSearchQuery && !this.hasMore) || this.isLoading || !this.searchQuery;
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
      const { items, next } = await this.query(queryToSearch);

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
        items: [...prev.items, ...(stateUpdate.items || [])],
      }));
    }
  }

  async search(searchQuery: string) {
    await this.executeQuery(searchQuery);
  }

  async loadMore() {
    await this.executeQuery();
  }

  resetState(stateOverrides?: Partial<SearchSourceState<T>>) {
    this.state.next({
      hasMore: true,
      isLoading: false,
      items: [],
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

  constructor(
    client: StreamChat<StreamChatGenerics>,
    { pageSize = 8 }: { pageSize?: number } = {},
  ) {
    super(pageSize);
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

  constructor(
    client: StreamChat<StreamChatGenerics>,
    { pageSize = 5 }: { pageSize?: number } = {},
  ) {
    super(pageSize);
    this.client = client;
  }

  protected async query(searchQuery: string) {
    const filters = { name: { $autocomplete: searchQuery } } as ChannelFilters<StreamChatGenerics>;
    const sort = {};
    const options = { limit: this.pageSize, offset: this.offset };
    const items = await this.client.queryChannels(filters, sort, options);
    return { items };
  }

  protected filterQueryResults(items: Channel<StreamChatGenerics>[]) {
    return items;
  }
}

// export class ChannelByMessageSearchSource<
//     StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
//   >
//   extends BaseSearchSource<Channel<StreamChatGenerics>>
//   implements SearchSource<Channel<StreamChatGenerics>> {
//   readonly type = 'channelsByMessages';
//   private client: StreamChat<StreamChatGenerics>;
//
//   constructor(
//     client: StreamChat<StreamChatGenerics>,
//     { pageSize = 10 }: { pageSize?: number } = {},
//   ) {
//     super(pageSize);
//     this.client = client;
//   }
//
//   protected async query(searchQuery: string) {
//     const channelFilters = {};
//     const messageFilters = searchQuery;
//     const options = { limit: this.pageSize, next: this.next } as SearchOptions<StreamChatGenerics>;
//
//     const { next, results } = await this.client.search(channelFilters, messageFilters, options);
//     const cids = results.map(({ message }) => message.cid);
//     const items = await this.client.queryChannels(
//       { cid: { $in: cids } } as ChannelFilters<StreamChatGenerics>,
//       { last_message_at: -1 },
//     );
//
//     return { items, next };
//   }
//
//   protected filterQueryResults(items: Channel<StreamChatGenerics>[]) {
//     return items;
//   }
// }

export class MessageSearchSource<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> extends BaseSearchSource<MessageResponse<StreamChatGenerics>> {
  readonly type = 'messages';
  private client: StreamChat<StreamChatGenerics>;

  constructor(
    client: StreamChat<StreamChatGenerics>,
    { pageSize = 10 }: { pageSize?: number } = {},
  ) {
    super(pageSize);
    this.client = client;
  }

  protected async query(searchQuery: string) {
    const channelFilters = {};
    const messageFilters = searchQuery;
    const options = { limit: this.pageSize, next: this.next } as SearchOptions<StreamChatGenerics>;

    const { next, results } = await this.client.search(channelFilters, messageFilters, options);
    const items = results.map(({ message }) => message);
    const cids = items
      .map((message) => message.cid)
      .filter((cid) => cid && !this.client.activeChannels[cid]); // prevent querying already loaded channels
    await this.client.queryChannels({ cid: { $in: cids } } as ChannelFilters<StreamChatGenerics>, {
      last_message_at: -1,
    });

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

export type SourceItemsRecord<Sources extends SearchSource[]> = {
  [K in Sources[number]['type']]: Array<
    InferSearchQueryResult<Extract<Sources[number], { type: K }>>
  >;
};

export type SearchControllerState<Sources extends SearchSource[] = DefaultSearchSources> = {
  isActive: boolean;
  items: SourceItemsRecord<Sources>;
  queryInProgress: Array<Sources[number]['type']>;
  searchQuery: string;
  input?: HTMLInputElement;
};

export type SearchControllerOptions<Sources extends SearchSource[] = DefaultSearchSources> = {
  sources?: Sources;
};

export class SearchController<Sources extends SearchSource[] = DefaultSearchSources> {
  sources: SearchSource[] = [];
  state: StateStore<SearchControllerState<Sources>>;

  constructor({ sources }: SearchControllerOptions<Sources> = {}) {
    this.state = new StateStore<SearchControllerState<Sources>>({
      isActive: false,
      items: {} as SourceItemsRecord<Sources>,
      queryInProgress: [],
      searchQuery: '',
    });
    sources?.forEach(this.addSource);
  }

  get hasMore() {
    return this.sources.some((source) => source.hasMore);
  }

  get isActive() {
    return this.state.getLatestValue().isActive;
  }

  get queryInProgress() {
    return this.state.getLatestValue().queryInProgress;
  }

  get items() {
    return this.state.getLatestValue().items;
  }

  get searchQuery() {
    return this.state.getLatestValue().searchQuery;
  }

  get searchSourceTypes(): Array<Sources[number]['type']> {
    return Object.keys(this.items);
  }

  get isLoading() {
    return this.state.getLatestValue().queryInProgress.length > 0;
  }

  isLoadingSource(sourceType: Sources[number]['type']) {
    return this.queryInProgress.findIndex((s) => s === sourceType) > -1;
  }

  setInputElement(input: HTMLInputElement) {
    this.state.partialNext({ input });
  }

  addSource(source: Sources[number]) {
    this.sources.push(source);
    this.state.partialNext({
      items: {
        ...this.state.getLatestValue().items,
        [source.type]: [],
      },
    });
  }

  removeSource(sourceType: Sources[number]['type']) {
    const originalSourcesLength = this.sources.length;
    const newSources = this.sources.filter((source) => source.type === sourceType);
    if (originalSourcesLength === newSources.length) return;
    this.sources = newSources;
    this.state.next((prev) => {
      const newItems = { ...prev.items };
      delete newItems[sourceType];
      return {
        ...prev,
        items: newItems,
      };
    });
  }

  activate() {
    this.state.partialNext({ isActive: true });
  }

  async search(searchQuery: string) {
    this.state.partialNext({ queryInProgress: this.searchSourceTypes });
    await Promise.all(this.sources.map((source) => source.search(searchQuery)));
    this.state.partialNext({
      items: Object.fromEntries(
        this.sources.map((source) => [source.type, source.items]),
      ) as SourceItemsRecord<Sources>,
      queryInProgress: [],
      searchQuery,
    });
  }

  async loadMore() {
    this.state.partialNext({ queryInProgress: this.searchSourceTypes });
    await Promise.all(this.sources.map((source) => source.loadMore()));
    this.state.partialNext({
      items: Object.fromEntries(
        this.sources.map((source) => [source.type, source.items]),
      ) as SourceItemsRecord<Sources>,
      queryInProgress: [],
    });
  }

  resetState(state?: Partial<SearchControllerState<Sources>>) {
    this.sources.forEach((source) => source.resetState());
    this.state.next({
      isActive: false,
      items: (Object.fromEntries(
        this.sources.map((source) => [source.type, []]),
      ) as unknown) as SourceItemsRecord<Sources>,
      queryInProgress: [],
      searchQuery: '',
      ...state,
    });
  }

  getSource(sourceType: string) {
    return this.sources.find((s) => s.type === sourceType);
  }

  sourceLastQueryError(sourceType: Sources[number]['type']) {
    return this.getSource(sourceType)?.lastQueryError;
  }

  async searchSource(sourceType: string, searchQuery: string) {
    const source = this.getSource(sourceType);
    if (!source || this.isLoadingSource(sourceType)) return;

    this.state.next((prev) => ({
      ...prev,
      queryInProgress: [...prev.queryInProgress, sourceType],
    }));
    await source.search(searchQuery);
    this.state.next((prev: SearchControllerState<Sources>) => ({
      ...prev,
      items: {
        ...prev.items,
        [sourceType]: source.items,
      },
      queryInProgress: prev.queryInProgress.filter((s) => s !== sourceType),
    }));
  }

  async loadMoreSource(sourceType: string) {
    const source = this.getSource(sourceType);
    if (!source || this.isLoadingSource(sourceType)) return;

    this.state.next((prev) => ({
      ...prev,
      queryInProgress: [...prev.queryInProgress, sourceType],
    }));
    await source.loadMore();
    this.state.next((prev: SearchControllerState<Sources>) => ({
      ...prev,
      items: {
        ...prev.items,
        [sourceType]: source.items,
      },
      queryInProgress: prev.queryInProgress.filter((s) => s !== sourceType),
    }));
  }

  // setSourceQueryParams() {}

  // resetStateSource(sourceType: string, state?: Partial<SearchControllerState<Sources>>) {
  //   const source = this.getSource(sourceType);
  //   if (!source) return;
  //   source.resetState();
  //   this.state.next((prev) => ({
  //     ...prev,
  //     items: (Object.fromEntries(
  //       this.sources.map((source) => [source.type, []]),
  //     ) as unknown) as SourceItemsRecord<Sources>,
  //     queryInProgress: undefined,
  //     searchQuery: '',
  //     ...state,
  //   }));
  // }
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
