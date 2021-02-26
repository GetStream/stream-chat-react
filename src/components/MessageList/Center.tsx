import React, { FC, ReactNode } from 'react';

const UnmemoizedCenter: FC<{ children: ReactNode }> = ({ children }) => (
  <div className='str-chat__list__center'>{children}</div>
);

export const Center = React.memo(UnmemoizedCenter);
