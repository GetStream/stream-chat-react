import React from 'react';

import './MessageListContainer.scss';

type Props = {};

export const MessageListContainer: React.FC<Props> = (props) => {
  return (
    <div className={'messagelist-container'}>
      <p>Message List Container</p>
    </div>
  );
};