import { Button, IconSearch, IconXCircle, VisuallyHidden } from '../../../components';
import { useStableId } from '../../../components/UtilityComponents/useStableId';
import { useTranslationContext } from '../../../context';

export type SearchInputProps = {
  onChange: (value: string) => void;
  value: string;
};

/**
 * Search box for the emoji picker. Mirrors the SDK's SearchBar structure (icon +
 * labelled input + clear button).
 */
export const SearchInput = ({ onChange, value }: SearchInputProps) => {
  const { t } = useTranslationContext('EmojiPickerSearchInput');
  const inputId = useStableId();

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
        placeholder={t('Search emoji')}
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
