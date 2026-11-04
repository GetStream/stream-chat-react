import type { KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { SearchSourceState } from 'stream-chat';
import { useStateStore } from 'stream-chat-react';
import type { Gif } from './gif';
import { GifSearchSource } from './GifSearchSource';
import './GifPicker.css';

// The grid's column count, the same as `grid-template-columns` in GifPicker.css.
const COLUMNS = 3;

// With a key the results come from Giphy, which asks apps to credit it next to them. Without one
// they come from the recipe's own catalogue, which needs no credit.
const GIPHY_API_KEY: string | undefined = import.meta.env.VITE_GIPHY_API_KEY;

const sourceSelector = ({
  hasNext,
  isLoading,
  items,
  lastQueryError,
  searchQuery,
}: SearchSourceState<Gif>) => ({
  hasNext,
  isLoading,
  items,
  lastQueryError,
  searchQuery,
});

/**
 * A search field over a grid of GIFs: trending while the field is empty, results for its text
 * otherwise. The next page loads when the end of the grid scrolls into view. The arrow keys move
 * from the field into the grid and around it, and Enter picks the focused GIF.
 */
export const GifPicker = ({ onPick }: { onPick: (gif: Gif) => void }) => {
  // One source per opened picker, so every opening starts with the trending GIFs.
  const [source] = useState(
    () =>
      new GifSearchSource({
        apiKey: GIPHY_API_KEY,
        debounceMs: 300,
        pageSize: 12,
      }),
  );
  const { hasNext, isLoading, items, lastQueryError, searchQuery } = useStateStore(
    source.state,
    sourceSelector,
  );
  const [text, setText] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLUListElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    source.activate();
    void source.search('');
    return () => source.cancelScheduledQuery();
  }, [source]);

  // Loads the next page once the end of the grid is in view. It waits while the typed text hasn't
  // been searched yet: the next page and a new search share one debounce, so loading a page then
  // would drop the new search.
  useEffect(() => {
    const end = endRef.current;
    if (!end || !items?.length || !hasNext || text !== searchQuery) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void source.search();
      },
      { root: scrollerRef.current, rootMargin: '0px 0px 120px 0px' },
    );
    observer.observe(end);
    return () => observer.disconnect();
  }, [hasNext, items, searchQuery, source, text]);

  const focusTile = (index: number) => {
    const tiles = gridRef.current?.querySelectorAll<HTMLButtonElement>('button');
    const tile = tiles?.[Math.max(0, Math.min(index, tiles.length - 1))];
    tile?.focus();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'ArrowDown' || !items?.length) return;
    event.preventDefault();
    focusTile(0);
  };

  const handleGridKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const steps: Record<string, number> = {
      ArrowDown: COLUMNS,
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -COLUMNS,
    };
    const step = steps[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const next = focusedIndex + step;
    if (next < 0) inputRef.current?.focus();
    else focusTile(next);
  };

  const status = lastQueryError
    ? "Couldn't load GIFs."
    : items?.length === 0
      ? `No GIFs for “${searchQuery}”.`
      : !items && isLoading
        ? 'Loading…'
        : undefined;

  return (
    <div className='cookbook-gif-picker'>
      <input
        aria-label='Search GIFs'
        className='cookbook-gif-picker__input'
        onChange={(event) => {
          setText(event.target.value);
          setFocusedIndex(0);
          void source.search(event.target.value);
        }}
        onKeyDown={handleInputKeyDown}
        placeholder='Search GIFs'
        ref={inputRef}
        type='search'
        value={text}
      />
      <div className='cookbook-gif-picker__heading'>
        {searchQuery ? `Results for “${searchQuery}”` : 'Trending'}
      </div>
      <div className='cookbook-gif-picker__scroller' ref={scrollerRef}>
        {/* Always rendered, so screen readers announce a status when its text changes. */}
        <p aria-live='polite' className='cookbook-gif-picker__status'>
          {status}
        </p>
        {!!items?.length && (
          <ul
            aria-label='GIFs'
            className='cookbook-gif-picker__grid'
            onKeyDown={handleGridKeyDown}
            ref={gridRef}
          >
            {items.map((gif, index) => (
              <li key={gif.id}>
                <button
                  // Giphy titles are often empty.
                  aria-label={gif.title || 'GIF'}
                  className='cookbook-gif-picker__tile'
                  onClick={() => onPick(gif)}
                  onFocus={() => setFocusedIndex(index)}
                  // One tile in the tab order: the arrow keys move between the others.
                  tabIndex={index === focusedIndex ? 0 : -1}
                  type='button'
                >
                  <img
                    alt=''
                    className='cookbook-gif-picker__image'
                    loading='lazy'
                    src={gif.images.fixed_width_downsampled.url}
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
        {isLoading && !!items?.length && (
          <p className='cookbook-gif-picker__status'>Loading more…</p>
        )}
        <div ref={endRef} />
      </div>
      {!!GIPHY_API_KEY && (
        <p className='cookbook-gif-picker__attribution'>Powered by GIPHY</p>
      )}
    </div>
  );
};
