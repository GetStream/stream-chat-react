import React, { useContext } from 'react';

import { ChatViewContext } from './ChatView';
import { useComponentContextIcons, useTranslationContext } from '../../context';

/**
 * What a chat view shows while none of its slots has anything bound, worded for the active view
 * (channels or threads). `ChatView`'s built-in workspace layout renders it; an app rendering its
 * own views places it wherever its empty state goes.
 */
export const ChatViewEmptyPlaceholder = () => {
  const { IconMessageBubble } = useComponentContextIcons();
  const { t } = useTranslationContext();
  // outside a ChatView there is no active view; the channels wording applies
  const activeView = useContext(ChatViewContext)?.activeView ?? 'channels';

  return (
    <div className='str-chat__chat-view__empty-placeholder'>
      <IconMessageBubble />
      <p className='str-chat__chat-view__empty-placeholder-text'>
        {activeView === 'threads'
          ? t('slotLayout.chatView.empty.threads.text', 'No thread selected')
          : t('slotLayout.chatView.empty.channels.text', 'No chat selected')}
      </p>
    </div>
  );
};
