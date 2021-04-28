import React from 'react';

import { ChatDown, ChatDownProps } from '../ChatDown/ChatDown';
import { LoadingChannels } from '../Loading/LoadingChannels';

export type ChannelListMessengerProps = {
  /** Whether or not the channel query request returned an errored response */
  error?: boolean;
  /** Whether or not channels are currently loading */
  loading?: boolean;
  /** Custom UI component to display a loading error, defaults to and accepts same props as: [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown/ChatDown.tsx) */
  LoadingErrorIndicator?: React.ComponentType<ChatDownProps>;
  /** Custom UI component to display a loading indicator, defaults to and accepts same props as: [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Loading/LoadingChannels.tsx) */
  LoadingIndicator?: React.ComponentType;
};

/**
 * ChannelListMessenger - A preview list of channels, allowing you to select the channel you want to open
 */
export const ChannelListMessenger: React.FC<ChannelListMessengerProps> = (props) => {
  const {
    children,
    error = false,
    loading,
    LoadingErrorIndicator = ChatDown,
    LoadingIndicator = LoadingChannels,
  } = props;

  if (error) {
    return <LoadingErrorIndicator type='Connection Error' />;
  }

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <div className='str-chat__channel-list-messenger'>
      <div className='str-chat__channel-list-messenger__main'>{children}</div>
    </div>
  );
};
