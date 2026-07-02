import { useEffect, useRef } from 'react';
import { Button, IconSearch, IconXCircle, VisuallyHidden } from '../../../components';
import { useStableId } from '../../../components/UtilityComponents/useStableId';
import { useTranslationContext } from '../../../context';

export type SearchInputProps = {
  onChange: (value: string) => void;
  value: string;
  /** Called when ArrowDown is pressed, to move focus into the emoji grid. */
  onArrowDown?: () => void;
};

/**
 * Search box for the emoji picker. Mirrors the SDK's SearchBar structure (icon +
 * labelled input + clear button) and receives focus when the picker opens.
 */
export const SearchInput = ({ onArrowDown, onChange, value }: SearchInputProps) => {
  const { t } = useTranslationContext('EmojiPickerSearchInput');
  const inputId = useStableId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            onArrowDown?.();
          }
        }}
        placeholder={t('Search emoji')}
        ref={inputRef}
        type='text'
        value={value}
      />
      {value ? (
        <Button
          appearance='ghost'
          aria-label={t('aria/Clear emoji search')}
          circular
          className='str-chat__emoji-picker__search-clear'
          onClick={() => onChange('')}
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
