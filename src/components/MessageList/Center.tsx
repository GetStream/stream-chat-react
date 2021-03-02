import React, { PropsWithChildren } from 'react';

const UnMemoizedCenter: React.FC<PropsWithChildren<{ key: string }>> = ({
  children,
}) => <div className='str-chat__list__center'>{children}</div>;

export const Center = React.memo(UnMemoizedCenter) as typeof UnMemoizedCenter;
