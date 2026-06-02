import clsx from 'clsx';
import React, { useCallback, useState } from 'react';

import { useComponentContext, useTranslationContext } from '../../context';
import {
  type ChannelAvatarProps,
  ChannelAvatar as DefaultChannelAvatar,
} from '../Avatar';
import { ChannelDetail as DefaultChannelDetail } from '../ChannelDetail/ChannelDetail';
import { GlobalModal } from '../Modal';

export type AvatarWithChannelDetailProps = ChannelAvatarProps & {
  Avatar?: React.ComponentType<ChannelAvatarProps>;
  ChannelDetail?: React.ComponentType;
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
        className='str-chat__channel-header__avatar-button'
        onClick={openModal}
        type='button'
      >
        <AvatarComponent
          {...avatarProps}
          className={clsx('str-chat__channel-header__avatar-button-avatar', className)}
        />
      </button>
      <Modal
        aria-label={t('aria/Channel details')}
        dialogRootProps={avatarWithChannelDetailDialogRootProps}
        onClose={closeModal}
        open={isModalOpen}
      >
        <ChannelDetail />
      </Modal>
    </>
  );
};
