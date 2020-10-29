import React from 'react';
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

const theme = 'light';

export const CustomerApp = ({ channel, open, setOpen, supportClient }) => {
  const toggleDemo = () => setOpen(!open);

  return (
    <div className={`customer-wrapper ${open ? 'wrapper--open' : ''}`}>
      <Chat client={supportClient} theme={`commerce ${theme}`}>
        {channel && (
          <Channel {...{ channel }}>
            <Window>
              <SupportChannelHeader />
              {open && (
                <div style={{ background: '#005fff' }}>
                  <MessageList
                    EmptyStateIndicator={(props) => (
                      <EmptyStateIndicator {...props} {...{ channel }} />
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
      <ToggleButton onClick={toggleDemo} open={open} />
    </div>
  );
};
