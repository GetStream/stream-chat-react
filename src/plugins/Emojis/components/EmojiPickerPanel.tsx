import { type CSSProperties, useCallback, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { CategoryNav } from './CategoryNav';
import { EmojiButton } from './EmojiButton';
import { EmojiGrid, type EmojiPickerCategory } from './EmojiGrid';
import { EMOJI_CATEGORY_META } from './categories';
import { EmptyResults } from './EmptyResults';
import { PreviewPane } from './PreviewPane';
import { SearchInput } from './SearchInput';
import {
  type EmojiPickerContextValue,
  EmojiPickerProvider,
} from '../context/EmojiPickerContext';
import { useEmojiPickerState } from '../hooks/useEmojiPickerState';
import { buildEmojiSearchData, runSearch } from '../search';
import type { EmojiDataEmoji } from '../data';
import { useTranslationContext } from '../../../context';

export type EmojiSelection = {
  id: string;
  name: string;
  native: string;
};

export type EmojiPickerPanelProps = {
  onEmojiSelect: (emoji: EmojiSelection) => void;
  className?: string;
  style?: CSSProperties;
  theme?: 'auto' | 'light' | 'dark';
};

const themeClassName = (theme: EmojiPickerPanelProps['theme']) => {
  if (theme === 'light') return 'str-chat__theme-light';
  if (theme === 'dark') return 'str-chat__theme-dark';
  // 'auto' (default): inherit the ancestor `.str-chat__theme-*`.
  return undefined;
};

/**
 * The native React emoji picker panel that replaces emoji-mart's `<em-emoji-picker>`
 * web component. Loads the vendored dataset, renders search, category navigation,
 * the emoji grid and a preview, and emits the resolved native emoji on selection.
 */
export const EmojiPickerPanel = ({
  className,
  onEmojiSelect,
  style,
  theme,
}: EmojiPickerPanelProps) => {
  const { t } = useTranslationContext('EmojiPickerPanel');
  const { data } = useEmojiPickerState();
  const [previewedEmoji, setPreviewedEmoji] = useState<EmojiDataEmoji | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState('');
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const skinToneIndex = 0; // Wired to props in a later phase.

  const categories = useMemo<EmojiPickerCategory[]>(() => {
    if (!data) return [];
    return data.categories.map((category) => ({
      emojis: category.emojis.map((id) => data.emojis[id]).filter(Boolean),
      id: category.id,
      label: t(EMOJI_CATEGORY_META[category.id]?.labelKey ?? category.id),
    }));
  }, [data, t]);

  const searchIndex = useMemo(() => (data ? buildEmojiSearchData(data) : []), [data]);

  // `null` when not searching; otherwise the (possibly empty) list of matches.
  const searchedEmojis = useMemo<EmojiDataEmoji[] | null>(() => {
    const trimmed = query.trim();
    if (!trimmed || !data) return null;
    return (runSearch(searchIndex, trimmed) ?? [])
      .map((result) => data.emojis[result.id])
      .filter(Boolean);
  }, [data, query, searchIndex]);

  const onSelectEmoji = useCallback(
    (emoji: EmojiDataEmoji) => {
      const native = emoji.skins[skinToneIndex]?.native ?? emoji.skins[0]?.native ?? '';
      if (!native) return;
      onEmojiSelect({ id: emoji.id, name: emoji.name, native });
    },
    [onEmojiSelect],
  );

  const contextValue = useMemo<EmojiPickerContextValue>(
    () => ({ onSelectEmoji, setPreviewedEmoji, skinToneIndex }),
    [onSelectEmoji],
  );

  const handleNavigate = useCallback((categoryId: string) => {
    setQuery(''); // navigating a category exits search
    setActiveCategoryId(categoryId);
    // Defer so the category view has re-rendered before we scroll to the section.
    requestAnimationFrame(() => {
      gridContainerRef.current
        ?.querySelector<HTMLElement>(`[data-category-id="${categoryId}"]`)
        ?.scrollIntoView({ block: 'start' });
    });
  }, []);

  const isSearching = searchedEmojis !== null;

  return (
    <EmojiPickerProvider value={contextValue}>
      <div
        aria-label={t('aria/Emoji picker')}
        className={clsx('str-chat__emoji-picker', themeClassName(theme), className)}
        role='dialog'
        style={style}
      >
        {data ? (
          <>
            <SearchInput onChange={setQuery} value={query} />
            <CategoryNav
              activeCategoryId={isSearching ? undefined : activeCategoryId}
              categories={categories}
              onNavigate={handleNavigate}
            />
            <div
              className='str-chat__emoji-picker__grid-container'
              ref={gridContainerRef}
            >
              {isSearching ? (
                searchedEmojis.length ? (
                  <div className='str-chat__emoji-picker__grid' role='grid'>
                    <div className='str-chat__emoji-picker__category-emojis' role='row'>
                      {searchedEmojis.map((emoji) => (
                        <EmojiButton emoji={emoji} key={emoji.id} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyResults />
                )
              ) : (
                <EmojiGrid categories={categories} />
              )}
            </div>
            <PreviewPane emoji={previewedEmoji} />
          </>
        ) : (
          <div aria-busy='true' className='str-chat__emoji-picker__loading' />
        )}
      </div>
    </EmojiPickerProvider>
  );
};
