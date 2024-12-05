import React from 'react';
import clsx from 'clsx';
import type { Channel, ExtendableGenerics } from 'stream-chat';

import { useChannelMembershipState } from '../ChannelList';
import { Icon } from './icons';

export type ChannelPreviewActionButtonsProps<SCG extends ExtendableGenerics> = {
  channel: Channel<SCG>;
};

export function ChannelPreviewActionButtons<SCG extends ExtendableGenerics>({
  channel,
}: ChannelPreviewActionButtonsProps<SCG>) {
  const membership = useChannelMembershipState(channel);

  return (
    <div className='str-chat__channel-preview__action-buttons'>
      <button
        className={clsx(
          'str-chat__channel-preview__action-button',
          'str-chat__channel-preview__action-button--pin',
          membership.pinned_at && 'str-chat__channel-preview__action-button--active',
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (membership.pinned_at) {
            channel.unpin();
          } else {
            channel.pin();
          }
        }}
      >
        <Icon.Pin />
      </button>
      <button
        className={clsx(
          'str-chat__channel-preview__action-button',
          'str-chat__channel-preview__action-button--archive',
          membership.archived_at && 'str-chat__channel-preview__action-button--active',
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (membership.archived_at) {
            channel.unarchive();
          } else {
            channel.archive();
          }
        }}
      >
        <Icon.ArchiveBox />
      </button>
    </div>
  );
}
