import React from 'react';

import { useChatContext } from '../../context/ChatContext';
import type { PropsWithChildrenOnly } from '../../types/types';

export const MessageListMainPanel = ({ children }: PropsWithChildrenOnly) => {
  const { themeVersion } = useChatContext('MessageListMainPanel');

  if (themeVersion === '2') return <div className='str-chat__main-panel-inner'>{children}</div>;

  return <>{children}</>;
};
