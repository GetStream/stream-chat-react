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
import { CustomerChannelHeader } from './components/CustomerChannelHeader/CustomerChannelHeader';
import { CustomerMessageInput } from './components/MessageInput/CustomerMessageInput';

import { CloseCustomerIcon, OpenCustomerIcon } from './assets';

export const CustomerApp = ({ customerChannelId }) => {
  const { client: customerClient } = useContext(ChatContext);

  const [customerChannel, setCustomerChannel] = useState();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const getCustomerChannel = async () => {
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

    getCustomerChannel();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`customer-wrapper ${open ? 'wrapper--open' : ''}`}>
      {customerChannel && open && (
        <Channel channel={customerChannel}>
          <Window>
            <CustomerChannelHeader />
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
                <CustomerMessageInput {...props} {...{ open, setOpen }} />
              )}
              focus
            />
          </Window>
        </Channel>
      )}
      <div
        className={`toggle-button ${open && 'close-button'}`}
        onClick={() => setOpen(!open)}
      >
        {open ? <CloseCustomerIcon /> : <OpenCustomerIcon />}
      </div>
    </div>
  );
};
