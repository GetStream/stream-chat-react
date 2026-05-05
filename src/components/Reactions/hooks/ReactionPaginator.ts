import {
  BasePaginator,
  type PaginationQueryParams,
  type PaginatorOptions,
  type ReactionFilters,
  type ReactionResponse,
  type ReactionSort,
  type StreamChat,
} from 'stream-chat';

export class ReactionPaginator extends BasePaginator<ReactionResponse> {
  private client: StreamChat;
  private messageId: string;
  private _filters: ReactionFilters;
  private _sort: ReactionSort;
  protected usesCursorPagination = true;

  get filters(): ReactionFilters | undefined {
    return this._filters;
  }

  get sort(): ReactionSort | undefined {
    return this._sort;
  }

  set filters(filters: ReactionFilters) {
    this._filters = filters;
    this.invalidate();
  }

  set sort(sort: ReactionSort) {
    this._sort = sort;
    this.invalidate();
  }

  constructor({
    client,
    messageId,
    options,
  }: {
    client: StreamChat;
    messageId: string;
    options?: PaginatorOptions;
  }) {
    super(options);
    this.client = client;
    this.messageId = messageId;
    this._filters = {};
    this._sort = { created_at: -1 };
  }

  async query(params: PaginationQueryParams) {
    const direction = params.direction;

    const response = await this.client.queryReactions(
      this.messageId,
      this._filters,
      this._sort,
      {
        [direction]: direction === 'next' ? params.next : params.prev,
        limit: this.pageSize,
      },
    );

    return {
      items: response.reactions,
      next: response.next,
    };
  }

  public filterQueryResults(items: ReactionResponse[]) {
    return items;
  }
}
