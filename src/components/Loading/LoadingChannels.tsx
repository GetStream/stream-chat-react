import React from 'react';

const LoadingItems = () => (
  <div className='str-chat__channel-list-item-container'>
    <div
      aria-hidden='true'
      className='str-chat__channel-list-item str-chat__channel-list-item--loading'
    >
      <div className='str-chat__loading-channels-avatar' />
      <div className='str-chat__channel-list-item-data str-chat__channel-list-item-data--loading'>
        <div className='str-chat__loading-channels-username' />
        <div className='str-chat__loading-channels-status' />
      </div>
    </div>
  </div>
);

export const LoadingChannels = () => (
  <div className='str-chat__loading-channels'>
    <LoadingItems />
    <LoadingItems />
    <LoadingItems />
    <LoadingItems />
    <LoadingItems />
  </div>
);
