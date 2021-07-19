import React from 'react';
import { EmptyChatIcon, EmptyDMIcon, EmptyQAIcon } from '../../assets';

import { useEventContext } from '../../contexts/EventContext';

const EmptyStateWrapper: React.FC = ({ children }) => (
  <div className='chat-components-empty'>{children}</div>
);

export const EmptyStateIndicators = () => {
  const { chatType } = useEventContext();

  let Icon: React.FC;
  let title: string;
  let description: string;

  switch (chatType) {
    case 'qa':
      Icon = EmptyQAIcon;
      title = 'No questions yet';
      description = 'Send a question to the speakers.';
      break;

    case 'direct':
      Icon = EmptyDMIcon;
      title = 'No direct messages yet';
      description = 'You will see your first direct message here when it is received.';
      break;

    default:
      Icon = EmptyChatIcon;
      title = 'No chat yet';
      description = 'Send a message to start the conversation.';
      break;
  }

  return (
    <EmptyStateWrapper>
      <Icon />
      <div>{title}</div>
      <div>{description}</div>
    </EmptyStateWrapper>
  );
};
