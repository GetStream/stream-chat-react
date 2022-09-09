import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';

export type SearchInputController = {
  /** Clears the channel search state */
  clearState: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  /** Search input change handler */
  onSearch: React.ChangeEventHandler<HTMLInputElement>;
  /** Current search string */
  query: string;
};

export type AdditionalSearchInputProps = {
  /** Sets the input element into disabled state */
  disabled?: boolean;
  /** Custom placeholder text to be displayed in the search input */
  placeholder?: string;
};

export type SearchInputProps = AdditionalSearchInputProps & SearchInputController;

export const SearchInput = (props: SearchInputProps) => {
  const { disabled, inputRef, onSearch, placeholder, query } = props;

  const { t } = useTranslationContext('SearchInput');

  return (
    <input
      className='str-chat__channel-search-input'
      data-testid='search-input'
      disabled={disabled}
      onChange={onSearch}
      placeholder={placeholder ?? t('Search')}
      ref={inputRef}
      type='text'
      value={query}
    />
  );
};
