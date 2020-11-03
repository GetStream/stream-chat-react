import React, { useContext, useEffect, useState } from 'react';
import {
  Channel,
  ChatContext,
  MessageCommerce,
  MessageInput,
  MessageList,
  Window,
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
          name: 'Kevin Rosen',
          image: require('./assets/kevin-avatar.png'), // eslint-disable-line
          issue: 'Company Inquiry',
          subtitle: '#853 Company Inquiry',
        },
      );

      if (newChannel.state.messages.length) {
        newChannel.state.clearMessages();
      }

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
