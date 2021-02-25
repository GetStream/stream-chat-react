import React, { FC } from 'react';

const UnmemoizedCenter: FC = ({ children }) => (
  <div className='str-chat__list__center'>{children}</div>
);

export const Center = React.memo(UnmemoizedCenter);
