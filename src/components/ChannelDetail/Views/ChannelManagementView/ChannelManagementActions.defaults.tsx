import React, { useCallback, useEffect, useMemo, useState } from 'react';
import debounce from 'lodash.debounce';
import type { Channel } from 'stream-chat';

import {
  useChatContext,
  useComponentContext,
  useModalContext,
  useTranslationContext,
} from '../../../../context';
import { isDmChannel, useStableCallback } from '../../../../utils';
import { useIsChannelMuted } from '../../../ChannelListItem/hooks/useIsChannelMuted';
import { useStateStore } from '../../../../store';
import { Alert } from '../../../Dialog';
import { Button } from '../../../Button';
import { Switch } from '../../../Form';
import { IconAudio, IconDelete, IconLeave, IconMute, IconNoSign } from '../../../Icons';
import { ListItemLayout } from '../../../ListItemLayout';
import { GlobalModal } from '../../../Modal';
import { useNotificationApi } from '../../../Notifications';
import { useChannelDetailContext } from '../../ChannelDetailContext';
import clsx from 'clsx';

export type ChannelManagementActionType =
  | 'blockUser'
  | 'deleteChat'
  | 'leaveChannel'
  | 'muteChannel'
  | 'muteUser'
  | (string & {});

export type ChannelManagementActionItem = {
  Component: React.ComponentType;
  type: ChannelManagementActionType;
};

const toError = (error: unknown) =>
  error instanceof Error ? error : new Error('An unknown error occurred');

const getDisplayName = (name?: string, fallback?: string) => name || fallback || '';

const BlockUserActionIcon = () => (
  <IconNoSign className='.str-chat__icon--destructive str-chat__channel-detail__action-icon str-chat__channel-detail__action-icon--block-user' />
);
const DeleteChatActionIcon = () => (
  <IconDelete className='.str-chat__icon--destructive str-chat__channel-detail__action-icon str-chat__channel-detail__action-icon--delete-chat' />
);
const MuteActionIcon = () => (
  <IconMute className='str-chat__channel-detail__action-icon str-chat__channel-detail__action-icon--mute' />
);
const MutedActionIcon = () => (
  <IconAudio className='str-chat__channel-detail__action-icon str-chat__channel-detail__action-icon--unmute' />
);
const LeaveChannelActionIcon = () => (
  <IconLeave className='.str-chat__icon--destructive str-chat__channel-detail__action-icon str-chat__channel-detail__action-icon--leave-channel' />
);

const channelManagementViewActionClassName = 'str-chat__channel-management-view-action';

const blockedUsersSelector = ({ userIds }: { userIds: string[] }) => ({ userIds });

type ChannelManagementConfirmationAlertProps = {
  action: 'blockUser' | 'deleteChat' | 'leaveChannel';
  cancelLabel: string;
  confirmLabel: string;
  description: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  testId: string;
  title: string;
};

const ChannelManagementConfirmationAlert = ({
  action,
  cancelLabel,
  confirmLabel,
  description,
  isSubmitting,
  onCancel,
  onConfirm,
  testId,
  title,
}: ChannelManagementConfirmationAlertProps) => (
  <Alert.Root
    className={clsx('str-chat__channel-management-confirmation-alert', {
      [`str-chat__channel-management-confirmation-alert--${action}`]: action,
    })}
    data-testid={testId}
  >
    <Alert.Header description={description} title={title} />
    <Alert.Actions>
      <Button
        appearance='solid'
        data-testid={`${testId}-confirm-button`}
        disabled={isSubmitting}
        onClick={onConfirm}
        size='md'
        variant='danger'
      >
        {confirmLabel}
      </Button>
      <Button
        appearance='outline'
        autoFocus
        data-testid={`${testId}-cancel-button`}
        disabled={isSubmitting}
        onClick={onCancel}
        size='md'
        variant='secondary'
      >
        {cancelLabel}
      </Button>
    </Alert.Actions>
  </Alert.Root>
);

const useOtherMember = () => {
  const { client } = useChatContext();
  const { channel } = useChannelDetailContext();

  return useMemo(() => {
    const stateMembers = Object.values(channel.state?.members ?? {});
    const members = stateMembers.length ? stateMembers : (channel.data?.members ?? []);

    return members.find(
      (member) => member.user?.id && member.user.id !== client.user?.id,
    );
  }, [channel, client.user?.id]);
};

const useChannelManagementActionFilterState = () => {
  const { client } = useChatContext();
  const { channel } = useChannelDetailContext();
  const otherMember = useOtherMember();
  const resolvedIsDmChannel = isDmChannel({
    channel,
    ownUserId: client.user?.id,
  });
  const isGroupChannel = !resolvedIsDmChannel;
  const ownCapabilities = channel.data?.own_capabilities;
  const isDmChannelWithOtherUser =
    resolvedIsDmChannel && otherMember?.user?.id !== client.user?.id;

  return {
    canBlockUser:
      isDmChannelWithOtherUser && ownCapabilities?.includes('ban-channel-members'),
    canLeaveChannel: isGroupChannel && ownCapabilities?.includes('leave-channel'),
    canMuteChannel: ownCapabilities?.includes('mute-channel'),
    canMuteUser: isDmChannelWithOtherUser,
  };
};

export const useBaseChannelManagementActionSetFilter = (
  channelManagementActionSet: ChannelManagementActionItem[],
) => {
  const { canBlockUser, canLeaveChannel, canMuteChannel, canMuteUser } =
    useChannelManagementActionFilterState();

  return useMemo(
    () =>
      channelManagementActionSet.filter((action) => {
        switch (action.type) {
          case 'blockUser':
            return canBlockUser;
          case 'muteChannel':
            return canMuteChannel;
          case 'muteUser':
            return canMuteUser;
          case 'leaveChannel':
            return canLeaveChannel;
          default:
            return true;
        }
      }),
    [
      canBlockUser,
      canLeaveChannel,
      canMuteChannel,
      canMuteUser,
      channelManagementActionSet,
    ],
  );
};

const ChannelMuteAction = () => {
  const { channel } = useChannelDetailContext();
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();
  const { muted: channelMuted } = useIsChannelMuted(channel);
  const [optimisticChannelMuted, setOptimisticChannelMuted] = useState(channelMuted);

  useEffect(() => {
    setOptimisticChannelMuted(channelMuted);
  }, [channelMuted]);

  const toggleChannelMuteRequest = useStableCallback(
    (nextMuted: boolean, targetChannel: Channel) => {
      if (!nextMuted) {
        return targetChannel
          .unmute()
          .then(() =>
            addNotification({
              context: { channel: targetChannel },
              emitter: 'ChannelManagementView',
              message: t('Channel unmuted'),
              severity: 'success',
              type: 'api:channel:unmute:success',
            }),
          )
          .catch((error) => {
            setOptimisticChannelMuted(true);

            return addNotification({
              context: { channel: targetChannel },
              emitter: 'ChannelManagementView',
              error: toError(error),
              message: t('Error unmuting channel'),
              severity: 'error',
              type: 'api:channel:unmute:failed',
            });
          });
      }

      return targetChannel
        .mute()
        .then(() =>
          addNotification({
            context: { channel: targetChannel },
            emitter: 'ChannelManagementView',
            message: t('Channel muted'),
            severity: 'success',
            type: 'api:channel:mute:success',
          }),
        )
        .catch((error) => {
          setOptimisticChannelMuted(false);

          return addNotification({
            context: { channel: targetChannel },
            emitter: 'ChannelManagementView',
            error: toError(error),
            message: t('Error muting channel'),
            severity: 'error',
            type: 'api:channel:mute:failed',
          });
        });
    },
  );

  const toggleChannelMute = useMemo(
    () => debounce(toggleChannelMuteRequest, 1000),
    [toggleChannelMuteRequest],
  );

  useEffect(
    () => () => {
      toggleChannelMute.cancel();
    },
    [toggleChannelMute],
  );

  const toggleOptimisticChannelMute = useCallback(() => {
    const nextMuted = !optimisticChannelMuted;

    setOptimisticChannelMuted(nextMuted);
    toggleChannelMute(nextMuted, channel);
  }, [channel, optimisticChannelMuted, toggleChannelMute]);

  const rootProps = useMemo(
    () => ({
      'aria-pressed': optimisticChannelMuted,
      className: clsx(
        'str-chat__form__switch-field',
        channelManagementViewActionClassName,
      ),
      onClick: toggleOptimisticChannelMute,
    }),
    [optimisticChannelMuted, toggleOptimisticChannelMute],
  );
  const TrailingSlot = useMemo(() => {
    function ChannelMuteSwitch() {
      return <Switch on={optimisticChannelMuted} presentation />;
    }

    return ChannelMuteSwitch;
  }, [optimisticChannelMuted]);

  return (
    <ListItemLayout
      LeadingIcon={optimisticChannelMuted ? MutedActionIcon : MuteActionIcon}
      RootElement='button'
      rootProps={rootProps}
      title={optimisticChannelMuted ? t('Unmute chat') : t('Mute chat')}
      TrailingSlot={TrailingSlot}
    />
  );
};

const UserMuteAction = () => {
  const { client, mutes } = useChatContext();
  const { channel } = useChannelDetailContext();
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();
  const otherMember = useOtherMember();
  const userMuted = !!mutes.find((mute) => mute.target.id === otherMember?.user?.id);
  const [optimisticUserMuted, setOptimisticUserMuted] = useState(userMuted);

  useEffect(() => {
    setOptimisticUserMuted(userMuted);
  }, [userMuted]);

  const otherMemberUserId = otherMember?.user?.id;
  const toggleUserMuteRequest = useStableCallback(
    (nextMuted: boolean, targetUserId?: string) => {
      if (!targetUserId) return;

      if (!nextMuted) {
        return client
          .unmuteUser(targetUserId)
          .then(() =>
            addNotification({
              context: { channel },
              emitter: 'ChannelManagementView',
              message: t('User unmuted'),
              severity: 'success',
              type: 'api:user:unmute:success',
            }),
          )
          .catch((error) => {
            setOptimisticUserMuted(true);

            return addNotification({
              context: { channel },
              emitter: 'ChannelManagementView',
              error: toError(error),
              message: t('Error unmuting user'),
              severity: 'error',
              type: 'api:user:unmute:failed',
            });
          });
      }

      return client
        .muteUser(targetUserId)
        .then(() =>
          addNotification({
            context: { channel },
            emitter: 'ChannelManagementView',
            message: t('User muted'),
            severity: 'success',
            type: 'api:user:mute:success',
          }),
        )
        .catch((error) => {
          setOptimisticUserMuted(false);

          return addNotification({
            context: { channel },
            emitter: 'ChannelManagementView',
            error: toError(error),
            message: t('Error muting user'),
            severity: 'error',
            type: 'api:user:mute:failed',
          });
        });
    },
  );

  const toggleUserMute = useMemo(
    () => debounce(toggleUserMuteRequest, 1000),
    [toggleUserMuteRequest],
  );

  useEffect(
    () => () => {
      toggleUserMute.cancel();
    },
    [toggleUserMute],
  );

  const toggleOptimisticUserMute = useCallback(() => {
    const nextMuted = !optimisticUserMuted;

    setOptimisticUserMuted(nextMuted);
    toggleUserMute(nextMuted, otherMemberUserId);
  }, [optimisticUserMuted, otherMemberUserId, toggleUserMute]);

  const rootProps = useMemo(
    () => ({
      'aria-pressed': optimisticUserMuted,
      className: clsx(
        'str-chat__form__switch-field',
        channelManagementViewActionClassName,
      ),
      onClick: toggleOptimisticUserMute,
    }),
    [optimisticUserMuted, toggleOptimisticUserMute],
  );
  const TrailingSlot = useMemo(() => {
    function UserMuteSwitch() {
      return <Switch on={optimisticUserMuted} presentation />;
    }

    return UserMuteSwitch;
  }, [optimisticUserMuted]);

  return (
    <ListItemLayout
      LeadingIcon={optimisticUserMuted ? MutedActionIcon : MuteActionIcon}
      RootElement='button'
      rootProps={rootProps}
      title={optimisticUserMuted ? t('Unmute user') : t('Mute user')}
      TrailingSlot={TrailingSlot}
    />
  );
};

const BlockUserAction = () => {
  const { client } = useChatContext();
  const { Modal = GlobalModal } = useComponentContext();
  const { channel } = useChannelDetailContext();
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();
  const otherMember = useOtherMember();
  const targetUserId = otherMember?.user?.id;
  const { userIds: blockedUserIds } = useStateStore(
    client.blockedUsers,
    blockedUsersSelector,
  );
  const isBlocked = useMemo(
    () => !!targetUserId && new Set(blockedUserIds).has(targetUserId),
    [blockedUserIds, targetUserId],
  );
  const [alertOpen, setAlertOpen] = useState(false);
  const [userBlockInProgress, setUserBlockInProgress] = useState(false);

  const closeBlockUserAlert = useCallback(() => {
    setAlertOpen(false);
  }, []);

  const openBlockUserAlert = useCallback(() => {
    setAlertOpen(true);
  }, []);

  const unblockUser = useCallback(async () => {
    if (!targetUserId) return;

    try {
      setUserBlockInProgress(true);
      await client.unBlockUser(targetUserId);
      addNotification({
        context: { channel },
        emitter: 'ChannelManagementView',
        message: t('User unblocked'),
        severity: 'success',
        type: 'api:user:unblock:success',
      });
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: 'ChannelManagementView',
        error: toError(error),
        message: t('Error unblocking user'),
        severity: 'error',
        type: 'api:user:unblock:failed',
      });
    } finally {
      setAlertOpen(false);
      setUserBlockInProgress(false);
    }
  }, [addNotification, channel, client, targetUserId, t]);

  const blockUser = useCallback(async () => {
    if (!targetUserId) return;

    try {
      setUserBlockInProgress(true);
      await client.blockUser(targetUserId);
      addNotification({
        context: { channel },
        emitter: 'ChannelManagementView',
        message: t('User blocked'),
        severity: 'success',
        type: 'api:user:block:success',
      });
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: 'ChannelManagementView',
        error: toError(error),
        message: t('Error blocking user'),
        severity: 'error',
        type: 'api:user:block:failed',
      });
    } finally {
      setAlertOpen(false);
      setUserBlockInProgress(false);
    }
  }, [addNotification, channel, client, targetUserId, t]);

  const rootProps = useMemo(
    () => ({
      className: channelManagementViewActionClassName,
      disabled: userBlockInProgress,
      onClick: openBlockUserAlert,
    }),
    [openBlockUserAlert, userBlockInProgress],
  );

  return (
    <>
      <ListItemLayout
        destructive
        LeadingIcon={BlockUserActionIcon}
        RootElement='button'
        rootProps={rootProps}
        title={isBlocked ? t('Unblock') : t('Block user')}
      />
      <Modal open={alertOpen} role='alertdialog'>
        <ChannelManagementConfirmationAlert
          action='blockUser'
          cancelLabel={t('Cancel')}
          confirmLabel={isBlocked ? t('Unblock') : t('Block User')}
          description={
            isBlocked
              ? t('This user will be able to message you again.')
              : t(
                  "This user won't be able to message you anymore. You can unblock them anytime.",
                )
          }
          isSubmitting={userBlockInProgress}
          onCancel={closeBlockUserAlert}
          onConfirm={isBlocked ? unblockUser : blockUser}
          testId='channel-detail-block-user-alert'
          title={isBlocked ? t('Unblock') : t('Block User')}
        />
      </Modal>
    </>
  );
};

const LeaveChannelAction = () => {
  const { client } = useChatContext();
  const { channel } = useChannelDetailContext();
  const { Modal = GlobalModal } = useComponentContext();
  const { close } = useModalContext();
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();
  const [alertOpen, setAlertOpen] = useState(false);
  const [leaveChannelInProgress, setLeaveChannelInProgress] = useState(false);

  const closeLeaveChannelAlert = useCallback(() => {
    setAlertOpen(false);
  }, []);

  const openLeaveChannelAlert = useCallback(() => {
    setAlertOpen(true);
  }, []);

  const leaveChannel = useCallback(async () => {
    if (!client.userID) return;

    try {
      setLeaveChannelInProgress(true);
      await channel.removeMembers([client.userID]);
      addNotification({
        context: { channel },
        emitter: 'ChannelManagementView',
        message: t('Left channel'),
        severity: 'success',
        type: 'api:channel:leave:success',
      });
      setAlertOpen(false);
      close();
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: 'ChannelManagementView',
        error: toError(error),
        message: t('Failed to leave channel'),
        severity: 'error',
        type: 'api:channel:leave:failed',
      });
    } finally {
      setLeaveChannelInProgress(false);
    }
  }, [addNotification, channel, client.userID, close, t]);

  const rootProps = useMemo(
    () => ({
      className: channelManagementViewActionClassName,
      disabled: leaveChannelInProgress,
      onClick: openLeaveChannelAlert,
    }),
    [leaveChannelInProgress, openLeaveChannelAlert],
  );

  return (
    <>
      <ListItemLayout
        destructive
        LeadingIcon={LeaveChannelActionIcon}
        RootElement='button'
        rootProps={rootProps}
        title={t('Leave chat')}
      />
      <Modal open={alertOpen} role='alertdialog'>
        <ChannelManagementConfirmationAlert
          action='leaveChannel'
          cancelLabel={t('Cancel')}
          confirmLabel={t('Leave chat')}
          description={t('Are you sure you want to leave this channel?')}
          isSubmitting={leaveChannelInProgress}
          onCancel={closeLeaveChannelAlert}
          onConfirm={leaveChannel}
          testId='channel-detail-leave-channel-alert'
          title={t('Leave chat')}
        />
      </Modal>
    </>
  );
};

const DeleteChatAction = () => {
  const { channel } = useChannelDetailContext();
  const { Modal = GlobalModal } = useComponentContext();
  const { close: closeChannelDetail } = useModalContext();
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();
  const otherMember = useOtherMember();
  const [alertOpen, setAlertOpen] = useState(false);
  const [deleteChatInProgress, setDeleteChatInProgress] = useState(false);
  const userName = getDisplayName(otherMember?.user?.name, otherMember?.user?.id);

  const closeDeleteChatAlert = useCallback(() => {
    setAlertOpen(false);
  }, []);

  const openDeleteChatAlert = useCallback(() => {
    setAlertOpen(true);
  }, []);

  const deleteChat = useCallback(async () => {
    try {
      setDeleteChatInProgress(true);
      await channel.delete();
      addNotification({
        context: { channel },
        emitter: 'ChannelManagementView',
        message: t('Chat deleted'),
        severity: 'success',
        type: 'api:channel:delete:success',
      });
      setAlertOpen(false);
      closeChannelDetail();
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: 'ChannelManagementView',
        error: toError(error),
        message: t('Error deleting chat'),
        severity: 'error',
        type: 'api:channel:delete:failed',
      });
    } finally {
      setDeleteChatInProgress(false);
    }
  }, [addNotification, channel, closeChannelDetail, t]);

  const rootProps = useMemo(
    () => ({
      className: channelManagementViewActionClassName,
      disabled: deleteChatInProgress,
      onClick: openDeleteChatAlert,
    }),
    [deleteChatInProgress, openDeleteChatAlert],
  );

  return (
    <>
      <ListItemLayout
        destructive
        LeadingIcon={DeleteChatActionIcon}
        RootElement='button'
        rootProps={rootProps}
        title={t('Delete chat')}
      />
      <Modal open={alertOpen} role='alertdialog'>
        <ChannelManagementConfirmationAlert
          action='deleteChat'
          cancelLabel={t('Cancel')}
          confirmLabel={t('Delete chat')}
          description={t(
            "This permanently deletes your message history with {{ user }}. This can't be undone.",
            { user: userName },
          )}
          isSubmitting={deleteChatInProgress}
          onCancel={closeDeleteChatAlert}
          onConfirm={deleteChat}
          testId='channel-detail-delete-chat-alert'
          title={t('Delete chat')}
        />
      </Modal>
    </>
  );
};

export const DefaultChannelManagementActions = {
  BlockUser: BlockUserAction,
  DeleteChat: DeleteChatAction,
  LeaveChannel: LeaveChannelAction,
  MuteChannel: ChannelMuteAction,
  MuteUser: UserMuteAction,
};

export const defaultChannelManagementActionSet: ChannelManagementActionItem[] = [
  {
    Component: DefaultChannelManagementActions.MuteChannel,
    type: 'muteChannel',
  },
  {
    Component: DefaultChannelManagementActions.MuteUser,
    type: 'muteUser',
  },
  {
    Component: DefaultChannelManagementActions.BlockUser,
    type: 'blockUser',
  },
  {
    Component: DefaultChannelManagementActions.LeaveChannel,
    type: 'leaveChannel',
  },
  {
    Component: DefaultChannelManagementActions.DeleteChat,
    type: 'deleteChat',
  },
];
