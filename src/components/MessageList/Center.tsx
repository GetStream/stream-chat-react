import React from 'react';
import type { PropsWithChildrenOnly } from '../../types/types';

const UnMemoizedCenter = ({ children }: PropsWithChildrenOnly) => (
  <div className='str-chat__list__center'>{children}</div>
);

export const Center = React.memo(UnMemoizedCenter) as typeof UnMemoizedCenter;
