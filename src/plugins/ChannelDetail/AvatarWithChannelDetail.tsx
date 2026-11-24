import clsx from 'clsx';
import React, { useCallback, useState } from 'react';
import type { Channel, ChannelStateData } from 'stream-chat';

import { useComponentContext, useTranslationContext } from '../../context';
import { useResolvedChannel } from '../../context/useContextChannel';
import {
  type ChannelAvatarProps,
  ChannelAvatar as DefaultChannelAvatar,
} from '../../components/Avatar/index';
import {
  type ChannelDetailProps,
  ChannelDetail as DefaultChannelDetail,
} from './ChannelDetail';
import { GlobalModal } from '../../components/Modal';
import { useStateStore } from '../../store';

export type AvatarWithChannelDetailProps = ChannelAvatarProps & {
  Avatar?: React.ComponentType<ChannelAvatarProps>;
  /** The channel whose details it opens. Defaults to the channel in context. */
  channel?: Channel;
  ChannelDetail?: React.ComponentType<ChannelDetailProps>;
};

const avatarWithChannelDetailDialogRootProps = {
  className: 'str-chat__channel-detail-modal',
};

/**
 * Whether the channel exists on the server: a query response was applied to it, or it was restored
 * from the offline database. A channel created only locally has no details to show yet.
 */
const existsOnServerSelector = ({ initialized, offlineMode }: ChannelStateData) => ({
  existsOnServer: initialized || offlineMode,
});

export const AvatarWithChannelDetail = ({
  Avatar,
  channel: channelOverride,
  ChannelDetail = DefaultChannelDetail,
  className,
  ...avatarProps
}: AvatarWithChannelDetailProps) => {
  const { t } = useTranslationContext();
  const channel = useResolvedChannel(channelOverride);
  const { Avatar: ContextAvatar, Modal = GlobalModal } = useComponentContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { existsOnServer } = useStateStore(channel.state, existsOnServerSelector);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const AvatarComponent =
    Avatar ??
    (ContextAvatar === AvatarWithChannelDetail ? undefined : ContextAvatar) ??
    DefaultChannelAvatar;

  return (
    <>
      <button
        aria-label={t(
          'channelDetail.avatarChannelDetail.openChannelDetails.ariaLabel',
          'Open channel details',
        )}
        className='str-chat__avatar-with-channel-detail-button'
        disabled={!existsOnServer}
        onClick={openModal}
        type='button'
      >
        <AvatarComponent
          {...avatarProps}
          className={clsx(
            'str-chat__avatar-with-channel-detail-button__avatar',
            className,
          )}
        />
      </button>
      <Modal
        aria-label={t(
          'channelDetail.avatarChannelDetail.channelDetails.ariaLabel',
          'Channel details',
        )}
        dialogRootProps={avatarWithChannelDetailDialogRootProps}
        onClose={closeModal}
        open={isModalOpen}
      >
        <ChannelDetail channel={channel} />
      </Modal>
    </>
  );
};
