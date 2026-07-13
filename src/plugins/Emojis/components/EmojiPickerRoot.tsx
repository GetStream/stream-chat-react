import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react';
import clsx from 'clsx';
import { type EmojiPickerCategory } from './EmojiGrid';
import { EMOJI_CATEGORY_META } from './categories';
import { resolveFrequentlyUsedEmoji } from './frequentlyUsed';
import { SKIN_TONES } from './skinTones';
import { EmojiPickerCellProvider } from '../context/EmojiPickerCellContext';
import {
  type EmojiPickerContextValue,
  EmojiPickerProvider,
} from '../context/EmojiPickerContext';
import { EmojiPickerPreviewProvider } from '../context/EmojiPickerPreviewContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useEmojiPickerState } from '../hooks/useEmojiPickerState';
import { buildEmojiSearchData, runSearch } from '../search';
import type { EmojiDataEmoji } from '../data';
import { filterEmojiData } from '../data/filterEmojiData';
import { useTranslationContext } from '../../../context';

// The grid renders 9 emoji per row by default; integrators change the column count via
// the `--str-chat__emoji-picker-per-line` CSS token (the SCSS falls back to 9). The
// "frequently used" section is capped to a single row.
const DEFAULT_COLUMNS = 9;
const FREQUENT_ROWS = 1;

export type EmojiSelection = {
  id: string;
  name: string;
  native: string;
};

export type EmojiPickerRootProps = {
  onEmojiSelect: (emoji: EmojiSelection) => void;
  /** Category ids to show, in order. Defaults to the dataset order. `frequent` always prepends. */
  categories?: string[];
  /** The picker slots to render (nav / search / grid / preview / skin-tone, in any arrangement). */
  children?: ReactNode;
  className?: string;
  /** Emoji ids to exclude from the grid and search. */
  exceptEmojis?: string[];
  /**
   * Ordered list of recently used emoji ids (most recent first), rendered as the
   * "frequently used" section. This is a controlled value — the owner (EmojiPicker)
   * holds it above the panel's mount so it survives the picker opening/closing.
   */
  frequentlyUsedIds?: string[];
  /** Called when the picker requests to close (e.g. the Escape key). */
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
export const themeClassName = (theme: EmojiPickerRootProps['theme']) => {
  if (theme === 'light') return 'str-chat__theme-light';
  if (theme === 'dark') return 'str-chat__theme-dark';
  // 'auto' (default): inherit the ancestor `.str-chat__theme-*`.
  return undefined;
};

/**
 * The provider + dialog container for the emoji picker. Loads the vendored dataset, owns
 * all shared picker state, and exposes it to its slot `children` via EmojiPickerContext
 * (plus an internal preview context for hover state). Also owns the container-level a11y
 * that survives any recomposition: `role="dialog"`, Escape-to-close, and the theme class.
 * While the dataset is loading or failed, it renders a loading / error+retry region in
 * place of the slots. `StreamEmojiPicker` renders this with the default slot arrangement;
 * integrators can render it directly with a custom arrangement of slots.
 *
 * Skin tone and frequently-used are fully controlled (`skinToneIndex`,
 * `frequentlyUsedIds`, `onSkinToneChange`): the picker is mounted only while open, so
 * this session state is owned by the always-mounted shell rather than held here.
 */
export const EmojiPickerRoot = ({
  categories: categoryFilter,
  children,
  className,
  exceptEmojis,
  frequentlyUsedIds = [],
  onClose,
  onEmojiSelect,
  onSkinToneChange,
  skinToneIndex = 0,
  style,
  theme,
}: EmojiPickerRootProps) => {
  const { t } = useTranslationContext();
  const { data, error, retry } = useEmojiPickerState();
  const status: 'error' | 'loading' | 'ready' = data
    ? 'ready'
    : error
      ? 'error'
      : 'loading';
  // One filtered view of the dataset feeds both the grid and the search index so
  // exclusions apply consistently. Returns the same reference when no filter is set.
  const filteredData = useMemo(
    () => (data ? filterEmojiData(data, { exceptEmojis }) : data),
    [data, exceptEmojis],
  );
  const [previewedEmoji, setPreviewedEmoji] = useState<EmojiDataEmoji | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState('');
  const [scrollTarget, setScrollTarget] = useState<{
    categoryId: string;
    nonce: number;
  } | null>(null);
  // Debounce the query that drives the search so typing doesn't re-scan the index and
  // re-render up to 90 result cells on every keystroke (clearing still exits at once).
  const debouncedQuery = useDebouncedValue(query, 120);

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

  const isSearching = searchedEmojis !== null;

  const resolveNative = useCallback(
    (emoji: EmojiDataEmoji) =>
      emoji.skins[skinToneIndex]?.native ?? emoji.skins[0]?.native ?? '',
    [skinToneIndex],
  );

  const selectEmoji = useCallback(
    (emoji: EmojiDataEmoji) => {
      const native = resolveNative(emoji);
      if (native) onEmojiSelect({ id: emoji.id, name: emoji.name, native });
    },
    [onEmojiSelect, resolveNative],
  );

  const setActiveCategory = useCallback(
    (categoryId: string) => setActiveCategoryId(categoryId),
    [],
  );

  const requestScrollToCategory = useCallback((categoryId: string) => {
    setQuery(''); // navigating a category exits search
    setActiveCategoryId(categoryId);
    // A "scroll here" signal for the grid; the nonce re-fires a repeat of the same id.
    setScrollTarget((prev) => ({ categoryId, nonce: (prev?.nonce ?? 0) + 1 }));
  }, []);

  const contextValue = useMemo<EmojiPickerContextValue>(
    () => ({
      activeCategoryId: activeCategoryId ?? categories[0]?.id ?? '',
      categories,
      isSearching,
      query,
      requestScrollToCategory,
      resolveNative,
      retry,
      scrollTarget,
      searchResults: searchedEmojis,
      selectEmoji,
      setActiveCategory,
      setQuery,
      setSkinTone: onSkinToneChange ?? noop,
      skinToneIndex,
      skinTones: SKIN_TONES,
      status,
    }),
    [
      activeCategoryId,
      categories,
      isSearching,
      onSkinToneChange,
      query,
      requestScrollToCategory,
      resolveNative,
      retry,
      scrollTarget,
      searchedEmojis,
      selectEmoji,
      setActiveCategory,
      skinToneIndex,
      status,
    ],
  );

  const previewValue = useMemo(
    () => ({ previewedEmoji, setPreviewedEmoji }),
    [previewedEmoji],
  );

  // The cold subset the default cell subscribes to, so the grid's ~hundreds of cells
  // don't re-render on hot state (scroll-spy active category, live query, scroll target).
  const cellValue = useMemo(
    () => ({ resolveNative, selectEmoji }),
    [resolveNative, selectEmoji],
  );

  return (
    <EmojiPickerProvider value={contextValue}>
      <EmojiPickerCellProvider value={cellValue}>
        <EmojiPickerPreviewProvider value={previewValue}>
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
            {status === 'ready' ? (
              children
            ) : status === 'error' ? (
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
        </EmojiPickerPreviewProvider>
      </EmojiPickerCellProvider>
    </EmojiPickerProvider>
  );
};
