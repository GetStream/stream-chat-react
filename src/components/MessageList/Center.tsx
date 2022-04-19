import React, { PropsWithChildren } from 'react';

interface UnMemoizedCenterProps {
  key: string;
}

const UnMemoizedCenter = ({ children, key }: PropsWithChildren<UnMemoizedCenterProps>) => (
  <div className='str-chat__list__center' key={key}>
    {children}
  </div>
);

export const Center = React.memo(UnMemoizedCenter) as typeof UnMemoizedCenter;
