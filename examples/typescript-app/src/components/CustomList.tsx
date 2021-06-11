import React, { PropsWithChildren } from 'react';

import { ChatDown, ChannelListMessengerProps } from 'stream-chat-react';
import { LoadingChannels } from 'stream-chat-react';

export const CustomList = (props: PropsWithChildren<ChannelListMessengerProps>) => {
    const {
      children,
      error,
      loading,
      LoadingErrorIndicator = ChatDown,
      LoadingIndicator = LoadingChannels,
    } = props;
  
    if (true) {
      return <LoadingErrorIndicator type={'connection'} />;
    }
  
    if (loading) {
      return <LoadingIndicator />;
    }
  
    return (
      <div>{children}</div>
    );
  };