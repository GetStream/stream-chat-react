import { type KeyboardEvent, useEffect, useRef } from 'react';
import { Button, IconSearch, IconXCircle, VisuallyHidden } from '../../../components';
import { useStableId } from '../../../components/UtilityComponents/useStableId';
import { useEmojiPickerContext } from '../context/EmojiPickerContext';
import { useTranslationContext } from '../../../context';

export type SearchInputProps = {
  /** Focus the input on mount when the picker opens (default `true`). */
  autoFocus?: boolean;
};

/**
 * Search box for the emoji picker. Mirrors the SDK's SearchBar structure (icon +
 * labelled input + clear button) and receives focus when the picker opens. Reads/reports
 * the query through context; ArrowDown moves focus to the first emoji cell within the
 * enclosing picker dialog (the default grid's DOM contract).
 */
export const SearchInput = ({ autoFocus = true }: SearchInputProps) => {
  const { t } = useTranslationContext('EmojiPickerSearchInput');
  const { query, setQuery } = useEmojiPickerContext('SearchInput');
  const inputId = useStableId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'ArrowDown') return;
    event.preventDefault();
    const dialog = event.currentTarget.closest('[role="dialog"]');
    dialog?.querySelector<HTMLElement>('.str-chat__emoji-picker__emoji')?.focus();
  };

  return (
    <div className='str-chat__emoji-picker__search'>
      <label htmlFor={inputId}>
        <VisuallyHidden>{t('Search emoji')}</VisuallyHidden>
      </label>
      <IconSearch />
      <input
        autoComplete='off'
        className='str-chat__emoji-picker__search-input'
        id={inputId}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={t('Search emoji')}
        ref={inputRef}
        type='text'
        value={query}
      />
      {query ? (
        <Button
          appearance='ghost'
          aria-label={t('aria/Clear emoji search')}
          circular
          className='str-chat__emoji-picker__search-clear'
          onClick={() => setQuery('')}
          size='xs'
          type='button'
          variant='secondary'
        >
          <IconXCircle />
        </Button>
      ) : null}
    </div>
  );
};
