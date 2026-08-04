import clsx from 'clsx';
import React, { useCallback, useState } from 'react';

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

export type AvatarWithChannelDetailProps = ChannelAvatarProps & {
  Avatar?: React.ComponentType<ChannelAvatarProps>;
  ChannelDetail?: React.ComponentType<ChannelDetailProps>;
};

const avatarWithChannelDetailDialogRootProps = {
  className: 'str-chat__channel-detail-modal',
};

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

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const AvatarComponent =
    Avatar ??
    (ContextAvatar === AvatarWithChannelDetail ? undefined : ContextAvatar) ??
    DefaultChannelAvatar;

  return (
    <>
      <button
        aria-label={t('aria/Open channel details')}
        className='str-chat__avatar-with-channel-detail-button'
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
        aria-label={t('aria/Channel details')}
        dialogRootProps={avatarWithChannelDetailDialogRootProps}
        onClose={closeModal}
        open={isModalOpen}
      >
        <ChannelDetail channel={channel} />
      </Modal>
    </>
  );
};
