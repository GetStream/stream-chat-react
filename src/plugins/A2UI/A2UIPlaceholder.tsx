import React from 'react';

/** What shows while a reply's A2UI loads, or while its first surface is being written. */
export const A2UIPlaceholder = () => (
  <div aria-busy='true' className='str-chat__a2ui str-chat__a2ui--loading'>
    <div className='str-chat__a2ui__placeholder' />
  </div>
);
