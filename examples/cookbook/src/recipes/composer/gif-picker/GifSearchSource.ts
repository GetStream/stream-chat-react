import { BaseSearchSource } from 'stream-chat';
import type { SearchQueryOptions, SearchSourceOptions } from 'stream-chat';
import { searchCatalogue } from './catalogue';
import type { Gif } from './gif';
import { fetchGiphyPage } from './giphy';

/**
 * Searches GIFs: Giphy's search, or its trending GIFs while the search text is empty. Without an
 * API key, it searches the local catalogue instead.
 */
export class GifSearchSource extends BaseSearchSource<Gif> {
  readonly type = 'gifs';
  private readonly apiKey?: string;

  constructor({ apiKey, ...options }: SearchSourceOptions & { apiKey?: string } = {}) {
    // An empty search text is a query too: it loads the trending GIFs.
    super({ allowEmptySearchString: true, ...options });
    this.apiKey = apiKey;
  }

  protected async query(searchQuery: string, { signal }: SearchQueryOptions = {}) {
    const page = { limit: this.pageSize, offset: this.offset ?? 0 };
    const items = this.apiKey
      ? await fetchGiphyPage({ apiKey: this.apiKey, page, searchQuery, signal })
      : searchCatalogue(searchQuery, page);
    return { items };
  }

  protected filterQueryResults(items: Gif[]) {
    return items;
  }
}
