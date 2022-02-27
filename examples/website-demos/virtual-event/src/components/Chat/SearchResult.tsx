import React, { useEffect, useState } from 'react';
import { Avatar, isChannel, SearchResultItemProps } from 'stream-chat-react';

import type { StreamChatGenerics } from '../../types';

export const SearchResult: React.FC<SearchResultItemProps<StreamChatGenerics>> = (props) => {
  const { focusedUser, index, result, selectResult } = props;

  const [actionsOpen, setActionsOpen] = useState(false);

  const focused = focusedUser === index;

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (event.target instanceof HTMLElement) {
        const elements = document.getElementsByClassName('search-result-actions');
        const actionsModal = elements.item(0);

        if (!actionsModal?.contains(event.target)) {
          setActionsOpen(false);
        }
      }
    };

    if (actionsOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [actionsOpen]); // eslint-disable-line

  if (isChannel(result)) return null;

  return (
    <div
      className={`search-result ${focused ? 'focused' : ''}`}
      onClick={() => selectResult(result)}
    >
      <Avatar image={result.image} name={result.name || result.id} user={result} />
      <div className='search-result-info'>
        <div className='search-result-info-name'>{result.name || result.id}</div>
        <div className='search-result-info-title'>{result.title || 'Attendee'}</div>
      </div>
    </div>
  );
};
