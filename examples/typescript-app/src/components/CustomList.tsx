import React, { PropsWithChildren } from 'react';

import { ChatDown, ChannelListMessengerProps } from 'stream-chat-react';
import { LoadingChannels } from 'stream-chat-react';

export const CustomList = (props: PropsWithChildren<ChannelListMessengerProps>) => {
    const CustomLoadingIndicator = (props: any) => {
        // render custom list item here
        console.log('props in custom loader:', props);
        return <div>loading indicator</div>
      };

    const {
      children,
      error,
      loading,
      LoadingErrorIndicator = CustomLoadingIndicator,
      LoadingIndicator = LoadingChannels,
    } = props;
  


    if (error) {
      return <LoadingErrorIndicator type={'connection'} />;
    }
  
    if (loading) {
      return <LoadingIndicator />;
    }
  
    return (
        <div>{children}</div>
      );
  };