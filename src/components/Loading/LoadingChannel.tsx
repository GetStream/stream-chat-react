import React from 'react';

type LoadingMessageProps = {
  bubbleSize: 'sm' | 'md' | 'lg';
  outgoing?: boolean;
};

const LoadingMessage = ({ bubbleSize, outgoing = false }: LoadingMessageProps) => (
  <div
    className={`str-chat__loading-channel-message ${
      outgoing
        ? 'str-chat__loading-channel-message--outgoing'
        : 'str-chat__loading-channel-message--incoming'
    }`}
  >
    {!outgoing ? <div className='str-chat__loading-channel-message-avatar' /> : null}
    <div className='str-chat__loading-channel-message-content'>
      <div
        className={`str-chat__loading-channel-message-bubble str-chat__loading-channel-message-bubble--${bubbleSize}`}
      ></div>
      <div className='str-chat__loading-channel-message-metadata'>
        <div className='str-chat__loading-channel-message-sender'></div>
        <div className='str-chat__loading-channel-message-date'></div>
      </div>
    </div>
  </div>
);

const LoadingMessageInput = () => (
  <div className='str-chat__message-composer-container str-chat__message-composer-container--loading'>
    <div className='str-chat__message-composer'>
      <div className='str-chat__loading-channel-message-input-button'></div>
      <div className='str-chat__loading-channel-message-input-pill'></div>
    </div>
  </div>
);

const LoadingChannelHeader = () => (
  <div className='str-chat__channel-header str-chat__channel-header--loading'>
    <div className='str-chat__channel-header__data str-chat__channel-header__data--loading'>
      <div className='str-chat__loading-channel-header-name'></div>
    </div>
    <div className='str-chat__loading-channel-header-avatar'></div>
  </div>
);

export const LoadingChannel = () => (
  <div className='str-chat__loading-channel'>
    <LoadingChannelHeader />
    <div className='str-chat__message-list str-chat__message-list--loading'>
      <div className='str-chat__message-list-scroll'>
        <div className='str-chat__loading-channel-message-list'>
          <LoadingMessage bubbleSize='lg' />
          <LoadingMessage bubbleSize='sm' outgoing />
          <LoadingMessage bubbleSize='md' />
        </div>
      </div>
    </div>
    <LoadingMessageInput />
  </div>
);
