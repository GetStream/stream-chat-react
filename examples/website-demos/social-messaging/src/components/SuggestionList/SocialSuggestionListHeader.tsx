import React from 'react';

import { SuggestionListHeaderProps } from 'stream-chat-react';

import { CommandBolt } from '../../assets';

export const SocialSuggestionListHeader: React.FC<SuggestionListHeaderProps> = (props) => {
  const { value } = props;
  const initialCharacter = value[0];

  switch (initialCharacter) {
    case '@' || ':':
      return null;

    case '/':
      return (
        <div className='suggestion-header'>
          <CommandBolt />
          <div className='suggestion-header-commands'>Instant Commands</div>
        </div>
      );

    default:
      return null;
  }
};
