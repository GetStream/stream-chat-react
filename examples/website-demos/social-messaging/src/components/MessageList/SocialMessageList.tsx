import React from 'react';

import { MessageList } from 'stream-chat-react';

import './SocialMessageList.scss';

type Props = {};

export const SocialMessageList: React.FC<Props> = (props) => {
  return (
    <div className='social-messagelist'>
      <MessageList />
    </div>
  );
};