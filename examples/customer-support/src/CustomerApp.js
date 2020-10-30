import React, { useContext, useEffect, useState } from 'react';
import {
  Channel,
  MessageCommerce,
  MessageList,
  MessageInput,
  Window,
  ChatContext,
} from 'stream-chat-react';

import { EmptyStateIndicator } from './components/CustomerEmptyStateIndicator/EmptyStateIndicator';
import { SupportChannelHeader } from './components/CustomerChannelHeader/CustomerChannelHeader';
import { SupportMessageInput } from './components/MessageInput/SupportMessageInput';

import { ToggleButton } from './assets/ToggleButton';

const customerChannelId = 'support-demo';

export const CustomerApp = () => {
  const { client: customerClient } = useContext(ChatContext);

  const [customerChannel, setCustomerChannel] = useState();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const getCustomerChannel = async () => {
      const [existingChannel] = await customerClient.queryChannels({
        id: customerChannelId,
      });

      if (existingChannel) await existingChannel.delete();

      const newChannel = await customerClient.channel(
        'commerce',
        customerChannelId,
        {
          image: 'https://i.stack.imgur.com/e7G42m.jpg',
          name: 'Hello',
          subtitle: 'We are here to help.',
        },
      );

      await newChannel.watch();

      setCustomerChannel(newChannel);
    };

    if (customerClient) {
      getCustomerChannel();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`customer-wrapper ${open ? 'wrapper--open' : ''}`}>
      {customerChannel && (
        <Channel channel={customerChannel}>
          <Window>
            <SupportChannelHeader />
            {open && (
              <div style={{ background: '#005fff' }}>
                <MessageList
                  EmptyStateIndicator={(props) => (
                    <EmptyStateIndicator {...props} channel={customerChannel} />
                  )}
                  Message={MessageCommerce}
                />
              </div>
            )}
            <MessageInput
              Input={(props) => (
                <SupportMessageInput {...props} {...{ open, setOpen }} />
              )}
              focus
            />
          </Window>
        </Channel>
      )}
      <ToggleButton {...{ open, setOpen }} />
    </div>
  );
};
