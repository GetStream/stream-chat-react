import clsx from 'clsx';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useComponentContextIcons, useTranslationContext } from '../../context';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/Form';

export type ChannelDetailSearchInputProps = {
  autoFocus?: boolean;
  onSearchChange: (query: string) => void;
  resetKey?: number;
};

export const ChannelDetailSearchInput = React.memo(
  ({ autoFocus, onSearchChange, resetKey }: ChannelDetailSearchInputProps) => {
    const { IconSearch, IconXCircle } = useComponentContextIcons();
    const { t } = useTranslationContext();
    const inputRef = useRef<HTMLInputElement>(null);
    const [searchInput, setSearchInput] = useState('');

    useEffect(() => {
      setSearchInput('');
    }, [resetKey]);

    const handleSearchChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setSearchInput(value);
        onSearchChange(value);
      },
      [onSearchChange],
    );

    const clearSearch = () => {
      setSearchInput('');
      onSearchChange('');
      inputRef.current?.focus();
    };

    return (
      <TextInput
        aria-label={t('common.search.ariaLabel', 'Search')}
        autoComplete='off'
        autoFocus={autoFocus}
        className='str-chat__channel-detail__search-input'
        leading={<IconSearch />}
        onChange={handleSearchChange}
        placeholder={t('common.search.ariaLabel', 'Search')}
        ref={inputRef}
        trailing={
          <Button
            appearance='ghost'
            aria-label={t('search.bar.clearSearch.ariaLabel', 'Clear search')}
            circular
            className={clsx(
              'str-chat__channel-detail__search-input-clear',
              'str-chat__form-text-input__clear-button',
              !searchInput && 'str-chat__form-text-input__clear-button--hidden',
            )}
            onClick={clearSearch}
            size='xs'
            variant='secondary'
          >
            <IconXCircle />
          </Button>
        }
        type='search'
        value={searchInput}
      />
    );
  },
);

ChannelDetailSearchInput.displayName = 'ChannelDetailSearchInput';
