import type { GiphyVersions, ImageData } from 'stream-chat';
import type { Gif } from './gif';
import { toImages } from './gif';

/** The part of a Giphy API GIF object the picker reads. */
type GiphyGif = {
  id: string;
  images: Partial<Record<GiphyVersions, Partial<ImageData>>>;
  title: string;
};

export type GifPage = { limit: number; offset: number };

/**
 * One page of Giphy's search results, or of its trending GIFs when `searchQuery` is empty.
 * `signal` cancels the request when a newer query starts.
 */
export const fetchGiphyPage = async ({
  apiKey,
  page,
  searchQuery,
  signal,
}: {
  apiKey: string;
  page: GifPage;
  searchQuery: string;
  signal?: AbortSignal;
}): Promise<Gif[]> => {
  const params = new URLSearchParams({
    api_key: apiKey,
    limit: String(page.limit),
    offset: String(page.offset),
    rating: 'g',
  });
  if (searchQuery) params.set('q', searchQuery);
  const endpoint = searchQuery ? 'search' : 'trending';

  const response = await fetch(`https://api.giphy.com/v1/gifs/${endpoint}?${params}`, {
    signal,
  });
  if (!response.ok) throw new Error(`Giphy answered ${response.status}`);
  const { data } = (await response.json()) as { data: GiphyGif[] };

  return data.map(({ id, images, title }) => ({ id, images: toImages(images), title }));
};
