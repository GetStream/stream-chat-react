import React from 'react';

import { SearchInput } from '../../components/Form';
import type { SearchInputProps } from '../../components/Form';

export type ChannelDetailSearchInputProps = Omit<SearchInputProps, 'className'>;

export const ChannelDetailSearchInput = React.memo(
  (props: ChannelDetailSearchInputProps) => (
    <SearchInput {...props} className='str-chat__channel-detail__search-input' />
  ),
);

ChannelDetailSearchInput.displayName = 'ChannelDetailSearchInput';
