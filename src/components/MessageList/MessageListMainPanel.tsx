import React from 'react';
import type { PropsWithChildrenOnly } from '../../types/types';

export const MESSAGE_LIST_MAIN_PANEL_CLASS =
  'str-chat__main-panel-inner str-chat__message-list-main-panel' as const;

export const MessageListMainPanel = ({ children }: PropsWithChildrenOnly) => (
  <div className={MESSAGE_LIST_MAIN_PANEL_CLASS}>{children}</div>
);
