import React from 'react';

type LoadingMessageProps = {
  bubbleSize: 'md' | 'lg';
  metadataSize: 'sm' | 'md';
  outgoing?: boolean;
};

const LoadingMessage = ({
  bubbleSize,
  metadataSize,
  outgoing = false,
}: LoadingMessageProps) => (
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
      <div
        className={`str-chat__loading-channel-message-metadata str-chat__loading-channel-message-metadata--${metadataSize}`}
      ></div>
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
          <LoadingMessage bubbleSize='lg' metadataSize='md' />
          <LoadingMessage bubbleSize='md' metadataSize='sm' outgoing />
          <LoadingMessage bubbleSize='lg' metadataSize='md' />
        </div>
      </div>
    </div>
    <LoadingMessageInput />
  </div>
);
