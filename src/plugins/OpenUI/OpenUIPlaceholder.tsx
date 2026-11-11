import React from 'react';

/** What shows while a reply's OpenUI loads. */
export const OpenUIPlaceholder = () => (
  <div aria-busy='true' className='str-chat__openui str-chat__openui--loading'>
    <div className='str-chat__openui__placeholder' />
  </div>
);
