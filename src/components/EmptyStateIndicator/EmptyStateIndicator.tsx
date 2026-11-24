import React from 'react';

import { ChannelListEmpty } from '../ChannelList/ListStates';
import { MessageListEmpty } from '../MessageList/ListStates';
import { useTranslationContext } from '../../context/TranslationContext';

export type EmptyStateIndicatorProps = {
  /** Which list is empty. A 'thread' list renders nothing. */
  listType?: 'channel' | 'message' | 'thread';
  /** Replaces the message list's text. It goes through `t`, so it may be a translation key. */
  messageText?: string;
};

// TODO(next major): remove with the deprecated `EmptyStateIndicator` ComponentContext key. The
// lists render their own empty states as their `ListEmptyUI` default.

/**
 * The empty state of the list named by `listType`. The channel list and the message lists render
 * their own empty states as their `ListEmptyUI` default; this component renders the same
 * ones for apps that pick the list by `listType`. Without `listType`, it renders "No items exist".
 */
export const EmptyStateIndicator = ({
  listType,
  messageText,
}: EmptyStateIndicatorProps) => {
  const { t } = useTranslationContext();

  if (listType === 'thread') return null;
  if (listType === 'channel') return <ChannelListEmpty />;
  if (listType === 'message') return <MessageListEmpty messageText={messageText} />;
  return <p>{t('emptyState.indicator.noItemsExist.text', 'No items exist')}</p>;
};
