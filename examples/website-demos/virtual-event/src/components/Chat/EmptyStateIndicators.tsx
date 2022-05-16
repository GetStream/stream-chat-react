import React from 'react';
import { EmptyStateIndicatorProps, useChannelStateContext } from 'stream-chat-react';

import { EmptyChatIcon, EmptyDMIcon, EmptyQAIcon } from '../../assets';
import { useEventContext } from '../../contexts/EventContext';

const EmptyStateWrapper = ({ children }: {children?: React.ReactNode}) => (
  <div className='chat-components-empty'>{children}</div>
);

export const EmptyStateIndicators: React.FC<
  EmptyStateIndicatorProps & { isDmChannel?: boolean }
> = ({ isDmChannel }) => {
  const { thread } = useChannelStateContext();
  const { chatType } = useEventContext();

  if (thread) return null;

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
      Icon = isDmChannel ? EmptyChatIcon : EmptyDMIcon;
      title = isDmChannel ? 'No chat yet' : 'No direct messages yet';
      description = isDmChannel
        ? 'Send a message to start the conversation.'
        : 'You will see your first direct message here when it is received.';
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
