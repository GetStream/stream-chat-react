import type { Gif } from './gif';
import { toImages } from './gif';
import type { GifPage } from './giphy';

/** A picsum.photos still at a given size. */
const still = (photoId: number, width: number, height: number) => ({
  frames: '1',
  height: String(height),
  size: '',
  url: `https://picsum.photos/id/${photoId}/${width}/${height}`,
  width: String(width),
});

/** Every rendition of the same still, in the sizes Giphy uses. */
const stillImages = (photoId: number) =>
  toImages({
    fixed_height: still(photoId, 267, 200),
    fixed_height_downsampled: still(photoId, 267, 200),
    fixed_height_still: still(photoId, 267, 200),
    fixed_width: still(photoId, 200, 150),
    fixed_width_downsampled: still(photoId, 200, 150),
    fixed_width_still: still(photoId, 200, 150),
    original: still(photoId, 800, 600),
  });

type CatalogueEntry = Gif & { tags: string[] };

const entry = (photoId: number, title: string, tags: string[]): CatalogueEntry => ({
  id: `picsum-${photoId}`,
  images: stillImages(photoId),
  tags,
  title,
});

/** The GIFs the picker offers without an API key: still photos, matched by title and tags. */
export const catalogue: CatalogueEntry[] = [
  entry(1016, 'Red canyon', ['canyon', 'mountain', 'rock', 'desert', 'travel']),
  entry(29, 'Snowy peaks', ['mountain', 'snow', 'winter', 'travel']),
  entry(1039, 'Waterfall', ['waterfall', 'water', 'mountain', 'nature']),
  entry(1043, 'Green valley', ['valley', 'mountain', 'nature']),
  entry(28, 'Forest path', ['forest', 'tree', 'nature']),
  entry(1018, 'Green hills', ['hill', 'mountain', 'travel', 'nature']),
  entry(225, 'Cup of tea', ['tea', 'drink', 'cozy']),
  entry(312, 'Honey jar', ['honey', 'food', 'sweet']),
  entry(488, 'Salad bowl', ['salad', 'food', 'lunch']),
  entry(1080, 'Strawberries', ['strawberry', 'fruit', 'food', 'sweet']),
  entry(237, 'Puppy', ['dog', 'puppy', 'animal', 'cute']),
  entry(1025, 'Dog in a blanket', ['dog', 'animal', 'cozy', 'cute']),
  entry(1015, 'River bend', ['river', 'water', 'mountain', 'travel']),
  entry(1036, 'Snowy camp', ['camp', 'snow', 'mountain', 'winter']),
  entry(13, 'Pebble beach', ['beach', 'sea', 'water', 'travel']),
  entry(1084, 'Walrus', ['walrus', 'animal', 'sea']),
  entry(433, 'Bear', ['bear', 'animal', 'nature']),
  entry(1074, 'Big cat', ['cat', 'animal']),
  entry(1002, 'Earth from space', ['space', 'earth', 'wow']),
  entry(1022, 'Northern lights', ['sky', 'mountain', 'night', 'wow', 'winter']),
  entry(1069, 'Jellyfish', ['jellyfish', 'sea', 'animal']),
  entry(102, 'Raspberries', ['raspberry', 'fruit', 'food']),
  entry(1050, 'Sea cliffs', ['sea', 'water', 'mountain', 'rock', 'travel']),
  entry(15, 'Forest waterfall', ['waterfall', 'water', 'mountain', 'forest']),
];

/** One page of the catalogue: every entry for an empty query, else those matching it. */
export const searchCatalogue = (searchQuery: string, { limit, offset }: GifPage) => {
  const words = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = catalogue.filter(({ tags, title }) => {
    const text = [title, ...tags].join(' ').toLowerCase();
    return words.every((word) => text.includes(word));
  });
  return matches.slice(offset, offset + limit).map(({ id, images, title }) => ({
    id,
    images,
    title,
  }));
};
