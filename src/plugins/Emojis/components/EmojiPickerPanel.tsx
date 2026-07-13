import { type CSSProperties, useCallback, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { CategoryNav } from './CategoryNav';
import { EmojiButton } from './EmojiButton';
import { EmojiGrid, type EmojiGridHandle, type EmojiPickerCategory } from './EmojiGrid';
import { EMOJI_CATEGORY_META } from './categories';
import { resolveFrequentlyUsedEmoji } from './frequentlyUsed';
import { EmptyResults } from './EmptyResults';
import { PreviewPane } from './PreviewPane';
import { SearchInput } from './SearchInput';
import { SkinToneSelector } from './SkinToneSelector';
import {
  type EmojiPickerContextValue,
  EmojiPickerProvider,
} from '../context/EmojiPickerContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useEmojiPickerState } from '../hooks/useEmojiPickerState';
import { useGridKeyboardNav } from '../hooks/useGridKeyboardNav';
import { buildEmojiSearchData, runSearch } from '../search';
import type { EmojiDataEmoji } from '../data';
import { filterEmojiData } from '../data/filterEmojiData';
import { useTranslationContext } from '../../../context';

// The grid renders 9 emoji per row by default; integrators change the column count via
// the `--str-chat__emoji-picker-per-line` CSS token (the SCSS falls back to 9), so the
// panel sets no inline width. The "frequently used" section is capped to a single row.
const DEFAULT_COLUMNS = 9;
const FREQUENT_ROWS = 1;

export type EmojiSelection = {
  id: string;
  name: string;
  native: string;
};

export type EmojiPickerPanelProps = {
  onEmojiSelect: (emoji: EmojiSelection) => void;
  /** Focus the search input when the panel mounts (default `true`). */
  autoFocus?: boolean;
  /** Category ids to show, in order. Defaults to the dataset order. `frequent` always prepends. */
  categories?: string[];
  className?: string;
  /** Emoji ids to exclude from the grid and search. */
  exceptEmojis?: string[];
  /**
   * Ordered list of recently used emoji ids (most recent first), rendered as the
   * "frequently used" section. This is a controlled value — the owner (EmojiPicker)
   * holds it above the panel's mount so it survives the picker opening/closing.
   */
  frequentlyUsedIds?: string[];
  /** Called when the panel requests to close (e.g. the Escape key). */
  onClose?: () => void;
  /** Called with the new skin tone index when the user changes it. */
  onSkinToneChange?: (skinTone: number) => void;
  /** Active skin tone index (0 = default, 1–5 = light → dark). Controlled by the owner. */
  skinToneIndex?: number;
  style?: CSSProperties;
  theme?: 'auto' | 'light' | 'dark';
};

const noop = () => undefined;

/**
 * Maps the `theme` prop to the class applied on the panel root. `light`/`dark` force
 * an absolute theme (the forced-light case is backed by a full light-variable override
 * in EmojiPicker.scss, since the SDK has no `.str-chat__theme-light` variable set);
 * `auto`/undefined applies no class and inherits the ancestor `.str-chat__theme-*`.
 * Exported for testing the class contract the theme CSS relies on.
 */
export const themeClassName = (theme: EmojiPickerPanelProps['theme']) => {
  if (theme === 'light') return 'str-chat__theme-light';
  if (theme === 'dark') return 'str-chat__theme-dark';
  // 'auto' (default): inherit the ancestor `.str-chat__theme-*`.
  return undefined;
};

/**
 * The native React emoji picker panel that replaces emoji-mart's `<em-emoji-picker>`
 * web component. Loads the vendored dataset, renders search, category navigation,
 * the emoji grid, a preview and a skin-tone selector, and emits the resolved native
 * emoji on selection.
 *
 * Skin tone and frequently-used are fully controlled (`skinToneIndex`,
 * `frequentlyUsedIds`, `onSkinToneChange`): the panel is mounted only while the
 * picker is open, so this session state is owned by the always-mounted `EmojiPicker`
 * shell rather than held here.
 */
export const EmojiPickerPanel = ({
  autoFocus = true,
  categories: categoryFilter,
  className,
  exceptEmojis,
  frequentlyUsedIds = [],
  onClose,
  onEmojiSelect,
  onSkinToneChange,
  skinToneIndex = 0,
  style,
  theme,
}: EmojiPickerPanelProps) => {
  const { t } = useTranslationContext('EmojiPickerPanel');
  const { data, error, retry } = useEmojiPickerState();
  // One filtered view of the dataset feeds both the grid and the search index so
  // exclusions apply consistently. Returns the same reference when no filter is set.
  const filteredData = useMemo(
    () => (data ? filterEmojiData(data, { exceptEmojis }) : data),
    [data, exceptEmojis],
  );
  const [previewedEmoji, setPreviewedEmoji] = useState<EmojiDataEmoji | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState('');
  // Debounce the query that drives the search so typing doesn't re-scan the index and
  // re-render up to 90 result cells on every keystroke (clearing still exits at once).
  const debouncedQuery = useDebouncedValue(query, 120);
  const emojiGridRef = useRef<EmojiGridHandle>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const baseCategories = useMemo<EmojiPickerCategory[]>(() => {
    if (!filteredData) return [];
    const built = filteredData.categories.map((category) => ({
      emojis: category.emojis.map((id) => filteredData.emojis[id]).filter(Boolean),
      id: category.id,
      label: t(EMOJI_CATEGORY_META[category.id]?.labelKey ?? category.id),
    }));
    // `categories` option: keep only the requested ids, in the requested order.
    if (!categoryFilter) return built;
    const byId = new Map(built.map((category) => [category.id, category]));
    return categoryFilter
      .map((id) => {
        if (!byId.has(id)) {
          console.warn(
            `[stream-chat-react] EmojiPicker: unknown category id "${id}" ignored.`,
          );
        }
        return byId.get(id);
      })
      .filter((category): category is EmojiPickerCategory => Boolean(category));
  }, [filteredData, categoryFilter, t]);

  const categories = useMemo<EmojiPickerCategory[]>(() => {
    if (!filteredData || !frequentlyUsedIds.length) return baseCategories;
    const frequent: EmojiPickerCategory = {
      // Capped to a single row so the section stays one row wide as more emoji are used.
      emojis: resolveFrequentlyUsedEmoji(
        filteredData,
        frequentlyUsedIds,
        DEFAULT_COLUMNS * FREQUENT_ROWS,
      ),
      id: 'frequent',
      label: t(EMOJI_CATEGORY_META.frequent.labelKey),
    };
    return frequent.emojis.length ? [frequent, ...baseCategories] : baseCategories;
  }, [baseCategories, filteredData, frequentlyUsedIds, t]);

  const scrollToCategory = useCallback((categoryId: string) => {
    emojiGridRef.current?.scrollToCategory(categoryId);
  }, []);

  // Keyboard nav can target a category that virtualization has unmounted; give it the
  // category order + a way to scroll one into view so focus can traverse the whole set.
  const { focusFirst, onKeyDown: onGridKeyDown } = useGridKeyboardNav(bodyRef, {
    categories,
    scrollToCategory,
  });

  const searchIndex = useMemo(
    () => (filteredData ? buildEmojiSearchData(filteredData) : []),
    [filteredData],
  );

  // `null` when not searching; otherwise the (possibly empty) list of matches. Clearing
  // the field (empty live `query`) exits search immediately; a non-empty query is taken
  // from the debounced value.
  const searchedEmojis = useMemo<EmojiDataEmoji[] | null>(() => {
    const trimmed = query.trim() && debouncedQuery.trim();
    if (!trimmed || !filteredData) return null;
    return (runSearch(searchIndex, trimmed) ?? [])
      .map((result) => filteredData.emojis[result.id])
      .filter(Boolean);
  }, [debouncedQuery, filteredData, query, searchIndex]);

  const onSelectEmoji = useCallback(
    (emoji: EmojiDataEmoji) => {
      const native = emoji.skins[skinToneIndex]?.native ?? emoji.skins[0]?.native ?? '';
      if (!native) return;
      onEmojiSelect({ id: emoji.id, name: emoji.name, native });
    },
    [onEmojiSelect, skinToneIndex],
  );

  const contextValue = useMemo<EmojiPickerContextValue>(
    () => ({ onSelectEmoji, setPreviewedEmoji, skinToneIndex }),
    [onSelectEmoji, skinToneIndex],
  );

  const handleNavigate = useCallback((categoryId: string) => {
    setQuery(''); // navigating a category exits search
    setActiveCategoryId(categoryId);
    // Defer so the (virtualized) category view has mounted before we scroll to it.
    requestAnimationFrame(() => {
      emojiGridRef.current?.scrollToCategory(categoryId);
    });
  }, []);

  const isSearching = searchedEmojis !== null;

  return (
    <EmojiPickerProvider value={contextValue}>
      <div
        aria-label={t('aria/Emoji picker')}
        className={clsx('str-chat__emoji-picker', themeClassName(theme), className)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            onClose?.();
          }
        }}
        role='dialog'
        style={style}
      >
        {data ? (
          <>
            <CategoryNav
              activeCategoryId={isSearching ? undefined : activeCategoryId}
              categories={categories}
              onNavigate={handleNavigate}
            />
            <SearchInput
              autoFocus={autoFocus}
              onArrowDown={focusFirst}
              onChange={setQuery}
              value={query}
            />
            <div
              className='str-chat__emoji-picker__body'
              onKeyDown={onGridKeyDown}
              ref={bodyRef}
            >
              {isSearching ? (
                searchedEmojis.length ? (
                  <div className='str-chat__emoji-picker__grid-container'>
                    <div className='str-chat__emoji-picker__grid'>
                      <div className='str-chat__emoji-picker__category-emojis'>
                        {searchedEmojis.map((emoji) => (
                          <EmojiButton emoji={emoji} key={emoji.id} />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyResults />
                )
              ) : (
                <EmojiGrid
                  categories={categories}
                  onActiveCategoryChange={setActiveCategoryId}
                  ref={emojiGridRef}
                />
              )}
            </div>
            <div className='str-chat__emoji-picker__footer'>
              <PreviewPane emoji={previewedEmoji} placeholderEmoji={null} />
              <SkinToneSelector
                onSelect={onSkinToneChange ?? noop}
                skinToneIndex={skinToneIndex}
              />
            </div>
          </>
        ) : error ? (
          <div className='str-chat__emoji-picker__error' role='alert'>
            <p className='str-chat__emoji-picker__error-message'>
              {t('Failed to load emojis')}
            </p>
            <button
              className='str-chat__emoji-picker__error-retry'
              onClick={retry}
              type='button'
            >
              {t('Retry')}
            </button>
          </div>
        ) : (
          <div aria-busy='true' className='str-chat__emoji-picker__loading' />
        )}
      </div>
    </EmojiPickerProvider>
  );
};
