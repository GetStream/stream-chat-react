import React from 'react';

const LoadingMessage = () => (
  <div className='str-chat__loading-channel-message'>
    <div className='str-chat__loading-channel-message-avatar'></div>
    <div className='str-chat__loading-channel-message-end'>
      <div className='str-chat__loading-channel-message-sender'></div>
      <div className='str-chat__loading-channel-message-last-row'>
        <div className='str-chat__loading-channel-message-text'></div>
        <div className='str-chat__loading-channel-message-date'></div>
      </div>
    </div>
  </div>
);

const LoadingMessageInput = () => (
  <div className='str-chat__loading-channel-message-input-row'>
    <div className='str-chat__loading-channel-message-input'></div>
    <div className='str-chat__loading-channel-message-send'></div>
  </div>
);

const LoadingChannelHeader = () => (
  <div className='str-chat__loading-channel-header'>
    <div className='str-chat__loading-channel-header-avatar'></div>
    <div className='str-chat__loading-channel-header-end'>
      <div className='str-chat__loading-channel-header-name'></div>
      <div className='str-chat__loading-channel-header-info'></div>
    </div>
  </div>
);

export const LoadingChannel = () => (
  <div className='str-chat__loading-channel'>
    <LoadingChannelHeader />
    <div className='str-chat__loading-channel-message-list'>
      {Array.from(Array(3)).map((_, i) => (
        <LoadingMessage key={`loading-message-${i}`} />
      ))}
    </div>
    <LoadingMessageInput />
  </div>
);
