import React, { useCallback, useEffect, useState } from 'react';

import { useTranslationContext } from '../../../../context';
import { TextInput } from '../../../Form';
import { IconSearch } from '../../../Icons';

export type ChannelMembersViewSearchInputProps = {
  autoFocus?: boolean;
  onSearchChange: (query: string) => void;
  resetKey?: number;
};

export const ChannelMembersViewSearchInput = React.memo(
  ({ autoFocus, onSearchChange, resetKey }: ChannelMembersViewSearchInputProps) => {
    const { t } = useTranslationContext();
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

    return (
      <TextInput
        aria-label={t('Search')}
        autoFocus={autoFocus}
        className='str-chat__channel-detail__channel-members-view__search-input'
        leading={<IconSearch />}
        onChange={handleSearchChange}
        placeholder={t('Search')}
        type='search'
        value={searchInput}
      />
    );
  },
);

ChannelMembersViewSearchInput.displayName = 'ChannelMembersViewSearchInput';
