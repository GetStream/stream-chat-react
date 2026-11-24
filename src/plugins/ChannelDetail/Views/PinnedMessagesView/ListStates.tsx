import React from 'react';

import { useTranslationContext } from '../../../../context';
import { useChannelDetailContext } from '../../ChannelDetailContext';
import { ChannelDetailEmptyList } from '../../ChannelDetailEmptyList';
import { PinnedMessagesEmptyList } from './PinnedMessagesEmptyList';
import { usePinnedMessagesCount } from './usePinnedMessagesCount';

// The pinned messages view's empty state.

/**
 * The pinned messages view's empty state, used while the app sets no `ListEmptyUI`. A
 * channel without pinned messages says so; one whose pinned messages a search query does not match
 * says that nothing was found.
 */
export const PinnedMessagesEmpty = () => {
  const { t } = useTranslationContext();
  const { channel } = useChannelDetailContext();
  const hasPinnedMessages = usePinnedMessagesCount(channel) > 0;

  if (!hasPinnedMessages) return <PinnedMessagesEmptyList />;

  return (
    <ChannelDetailEmptyList>
      {t('channelDetail.pinnedMessagesView.noMessagesFound.text', 'No messages found')}
    </ChannelDetailEmptyList>
  );
};
