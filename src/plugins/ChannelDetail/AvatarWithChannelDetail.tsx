import clsx from 'clsx';
import React, { useCallback, useState } from 'react';
import type { ChannelStateData } from 'stream-chat';

import { useChannel, useComponentContext, useTranslationContext } from '../../context';
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
  ChannelDetail?: React.ComponentType<ChannelDetailProps>;
};

const avatarWithChannelDetailDialogRootProps = {
  className: 'str-chat__channel-detail-modal',
};

/**
 * Whether the channel exists on the server: a query's response was applied to it, or it was restored
 * from the offline database. The details are loaded from the server, so a channel created only
 * locally (sent to the server with its first message) has none to show yet.
 */
const existsOnServerSelector = ({ initialized, offlineMode }: ChannelStateData) => ({
  existsOnServer: initialized || offlineMode,
});

export const AvatarWithChannelDetail = ({
  Avatar,
  ChannelDetail = DefaultChannelDetail,
  className,
  ...avatarProps
}: AvatarWithChannelDetailProps) => {
  const { t } = useTranslationContext();
  const channel = useChannel();
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
