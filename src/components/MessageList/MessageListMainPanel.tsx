import React from 'react';

import { useChatContext } from '../../context/ChatContext';
import type { PropsWithChildrenOnly } from '../../types/types';

export const MESSAGE_LIST_MAIN_PANEL_CLASS = 'str-chat__main-panel-inner' as const;

export const MessageListMainPanel = ({ children }: PropsWithChildrenOnly) => {
  const { themeVersion } = useChatContext('MessageListMainPanel');

  if (themeVersion === '2') return <div className={MESSAGE_LIST_MAIN_PANEL_CLASS}>{children}</div>;

  return <>{children}</>;
};
