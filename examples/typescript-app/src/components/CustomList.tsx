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
  
    if (error) {
      return <LoadingErrorIndicator type={'Connection'} />;
    }
  
    if (loading) {
      return <LoadingIndicator />;
    }

    console.log('children IS:', children);
  
    return (
      <div className='str-chat__channel-list-messenger'>
        <div className='str-chat__channel-list-messenger__main'>{children}</div>
      </div>
    );
  };