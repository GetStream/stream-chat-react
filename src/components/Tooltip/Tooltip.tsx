import React from 'react';

export const Tooltip: React.FC = (props) => (
  <div className='str-chat__tooltip' {...props}>
    {props.children}
  </div>
);
