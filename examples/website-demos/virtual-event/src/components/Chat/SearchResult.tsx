import React, { useState } from 'react';
import { Avatar, isChannel, SearchResultItemProps } from 'stream-chat-react';

import './ParticipantSearch.scss';

import { UserEllipse } from '../../assets';

import {
  AttachmentType,
  ChannelType,
  CommandType,
  EventType,
  MessageType,
  ReactionType,
  UserType,
} from '../../hooks/useInitChat';

const UserActions: React.FC = () => {
  const handleClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
  };

  return (
    <div className='search-result-actions'>
      <div onClick={handleClick} className='search-result-actions-item'>
        <div>Mute user</div>
      </div>
      <div onClick={handleClick} className='search-result-actions-item'>
        <div>Block user</div>
      </div>
      <div onClick={handleClick} className='search-result-actions-item'>
        <div>Report user</div>
      </div>
    </div>
  );
};

export const SearchResult: React.FC<
  SearchResultItemProps<
    AttachmentType,
    ChannelType,
    CommandType,
    EventType,
    MessageType,
    ReactionType,
    UserType
  >
> = (props) => {
  const { focusedUser, index, result, selectResult } = props;

  const [actionsOpen, setActionsOpen] = useState(false);

  const focused = focusedUser === index;

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
      <UserEllipse setActionsOpen={setActionsOpen} />
      {actionsOpen && <UserActions />}
    </div>
  );
};
