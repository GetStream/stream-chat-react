import React, { useEffect, useState } from 'react';
import {
  Chat,
  Channel,
  MessageCommerce,
  MessageList,
  MessageInput,
  Window,
} from 'stream-chat-react';

import { EmptyStateIndicator } from './components/CustomerEmptyStateIndicator/EmptyStateIndicator';
import { SupportChannelHeader } from './components/CustomerChannelHeader/CustomerChannelHeader';
import { SupportMessageInput } from './components/MessageInput/SupportMessageInput';

import { ToggleButton } from './assets/ToggleButton';

const customerChannelId = 'support-demo';
const theme = 'light';

export const CustomerApp = ({ customerClient }) => {
  const [customerChannel, setCustomerChannel] = useState();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const getCustomerChannel = async () => {
      const [existingChannel] = await customerClient.queryChannels({
        id: customerChannelId,
      });

      if (existingChannel) await existingChannel.delete();

      const newChannel = customerClient.channel('commerce', customerChannelId, {
        image: 'https://i.stack.imgur.com/e7G42m.jpg',
        name: 'Hello',
        subtitle: 'We are here to help.',
      });

      await newChannel.watch();

      setCustomerChannel(newChannel);
    };

    if (customerClient) {
      getCustomerChannel();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`customer-wrapper ${open ? 'wrapper--open' : ''}`}>
      <Chat client={customerClient} theme={`commerce ${theme}`}>
        {customerChannel && (
          <Channel channel={customerChannel}>
            <Window>
              <SupportChannelHeader />
              {open && (
                <div style={{ background: '#005fff' }}>
                  <MessageList
                    EmptyStateIndicator={(props) => (
                      <EmptyStateIndicator
                        {...props}
                        channel={customerChannel}
                      />
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
      </Chat>
      <ToggleButton {...{ open, setOpen }} />
    </div>
  );
};
