import React, { useEffect, useState } from 'react';
import { Avatar, isChannel, SearchResultItemProps } from 'stream-chat-react';

// import { BlockUser, MuteUser, ReportUser, UserEllipse } from '../../assets';

import {
  AttachmentType,
  ChannelType,
  CommandType,
  EventType,
  MessageType,
  ReactionType,
  UserType,
} from '../../hooks/useInitChat';

// const UserActions: React.FC = () => {
//   const handleClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
//     event.stopPropagation();
//   };

//   return (
//     <div className='search-result-actions'>
//       <div onClick={handleClick} className='search-result-actions-item'>
//         <div>Mute user</div>
//         <MuteUser />
//       </div>
//       <div onClick={handleClick} className='search-result-actions-item'>
//         <div>Block user</div>
//         <BlockUser />
//       </div>
//       <div onClick={handleClick} className='search-result-actions-item'>
//         <div>Report user</div>
//         <ReportUser />
//       </div>
//     </div>
//   );
// };

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
  // const [showEllipse, setShowEllipse] = useState(false);

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
      // onMouseEnter={() => setShowEllipse(true)}
      // onMouseLeave={() => setShowEllipse(false)}
    >
      <Avatar image={result.image} name={result.name || result.id} user={result} />
      <div className='search-result-info'>
        <div className='search-result-info-name'>{result.name || result.id}</div>
        <div className='search-result-info-title'>{result.title || 'Attendee'}</div>
      </div>
      {/* {showEllipse && <UserEllipse setActionsOpen={setActionsOpen} />}
      {actionsOpen && <UserActions />} */}
    </div>
  );
};
