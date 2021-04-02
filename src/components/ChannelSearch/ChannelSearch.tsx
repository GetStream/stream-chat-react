import React from 'react';

const UnMemoizedChannelSearch: React.FC = () => (
  <div className='str-chat__channel-search'>
    <input placeholder='Search' type='text' />
    <button type='submit'>
      <svg height='17' viewBox='0 0 18 17' width='18' xmlns='http://www.w3.org/2000/svg'>
        <path d='M0 17.015l17.333-8.508L0 0v6.617l12.417 1.89L0 10.397z' fillRule='evenodd' />
      </svg>
    </button>
  </div>
);

export const ChannelSearch = React.memo(UnMemoizedChannelSearch) as typeof UnMemoizedChannelSearch;
