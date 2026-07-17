import clsx from 'clsx';
import debounce from 'lodash.debounce';
import uniqBy from 'lodash.uniqby';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ChannelMemberResponse } from 'stream-chat';

import {
  useChannelListContext,
  useChatContext,
  useComponentContext,
  useModalContext,
  useTranslationContext,
} from '../../../../context';
import { useStableCallback } from '../../../../utils';
import { useStateStore } from '../../../../store';
import { Alert } from '../../../../components/Dialog';
import { Button } from '../../../../components/Button';
import { Switch } from '../../../../components/Form';
import {
  IconAudio as DefaultIconAudio,
  IconMessageBubble as DefaultIconMessageBubble,
  IconMute as DefaultIconMute,
  IconNoSign as DefaultIconNoSign,
  IconUserRemove as DefaultIconUserRemove,
} from '../../../../components/Icons';
import { ListItemLayout } from '../../../../components/ListItemLayout';
import { GlobalModal } from '../../../../components/Modal';
import { useNotificationApi } from '../../../../components/Notifications';
import { useChannelDetailContext } from '../../ChannelDetailContext';

export type ChannelMemberActionType =
  | 'blockUser'
  | 'muteUser'
  | 'removeUser'
  | 'sendMessage'
  | (string & {});

export type ChannelMemberActionItem = {
  Component: React.ComponentType;
  type: ChannelMemberActionType;
};

type ChannelMemberActionContextValue = {
  member: ChannelMemberResponse;
  memberDisplayName: string;
  targetUserId?: string;
};

const ChannelMemberActionContext = createContext<
  ChannelMemberActionContextValue | undefined
>(undefined);

export const ChannelMemberActionProvider = ({
  children,
  value,
}: React.PropsWithChildren<{ value: ChannelMemberActionContextValue }>) => (
  <ChannelMemberActionContext.Provider value={value}>
    {children}
  </ChannelMemberActionContext.Provider>
);

export const useChannelMemberActionContext = () => {
  const contextValue = useContext(ChannelMemberActionContext);
  if (!contextValue) {
    throw new Error(
      'The useChannelMemberActionContext hook was called outside of ChannelMemberActionProvider.',
    );
  }

  return contextValue;
};

const toError = (error: unknown) =>
  error instanceof Error ? error : new Error('An unknown error occurred');

const MemberMuteActionIcon = () => {
  const { icons: { IconMute = DefaultIconMute } = {} } = useComponentContext();
  return (
    <IconMute className='str-chat__channel-detail__action-icon str-chat__channel-detail__action-icon--mute' />
  );
};

const MemberUnmuteActionIcon = () => {
  const { icons: { IconAudio = DefaultIconAudio } = {} } = useComponentContext();
  return (
    <IconAudio className='str-chat__channel-detail__action-icon str-chat__channel-detail__action-icon--unmute' />
  );
};

const SendDirectMessageActionIcon = () => {
  const { icons: { IconMessageBubble = DefaultIconMessageBubble } = {} } =
    useComponentContext();
  return <IconMessageBubble className='str-chat__channel-detail__action-icon' />;
};

const BlockUserActionIcon = () => {
  const { icons: { IconNoSign = DefaultIconNoSign } = {} } = useComponentContext();
  return (
    <IconNoSign className='str-chat__icon--destructive str-chat__channel-detail__action-icon str-chat__channel-detail__action-icon--block-user' />
  );
};

const RemoveUserActionIcon = () => {
  const { icons: { IconUserRemove = DefaultIconUserRemove } = {} } =
    useComponentContext();
  return (
    <IconUserRemove className='str-chat__icon--destructive str-chat__channel-detail__action-icon str-chat__channel-detail__action-icon--remove-user' />
  );
};

const channelMemberDetailActionClassName = 'str-chat__channel-member-detail-action';

const blockedUsersSelector = ({ userIds }: { userIds: string[] }) => ({ userIds });

type ChannelMemberConfirmationAlertProps = {
  action: 'blockUser' | 'removeUser';
  cancelLabel: string;
  confirmLabel: string;
  description: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  testId: string;
  title: string;
};

const ChannelMemberConfirmationAlert = ({
  action,
  cancelLabel,
  confirmLabel,
  description,
  isSubmitting,
  onCancel,
  onConfirm,
  testId,
  title,
}: ChannelMemberConfirmationAlertProps) => (
  <Alert.Root
    className={clsx('str-chat__channel-member-confirmation-alert', {
      [`str-chat__channel-member-confirmation-alert--${action}`]: action,
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

const useChannelMemberActionFilterState = () => {
  const { client } = useChatContext();
  const { channel } = useChannelDetailContext();
  const { targetUserId } = useChannelMemberActionContext();
  const ownCapabilities = channel.data?.own_capabilities;
  const isCurrentUser = targetUserId === client.user?.id;

  return {
    // Blocking is a personal, per-user action (client.blockUser/unBlockUser),
    // independent of channel moderation capabilities like 'ban-channel-members'.
    canBlockUser: !isCurrentUser && !!targetUserId,
    canMuteUser: !isCurrentUser && !!targetUserId,
    canRemoveUser:
      !isCurrentUser &&
      !!targetUserId &&
      ownCapabilities?.includes('update-channel-members'),
    canSendMessage: !isCurrentUser && !!targetUserId,
  };
};

export const useBaseChannelMemberActionSetFilter = (
  channelMemberActionSet: ChannelMemberActionItem[],
) => {
  const { canBlockUser, canMuteUser, canRemoveUser, canSendMessage } =
    useChannelMemberActionFilterState();

  return useMemo(
    () =>
      channelMemberActionSet.filter((action) => {
        switch (action.type) {
          case 'blockUser':
            return canBlockUser;
          case 'muteUser':
            return canMuteUser;
          case 'removeUser':
            return canRemoveUser;
          case 'sendMessage':
            return canSendMessage;
          default:
            return true;
        }
      }),
    [canBlockUser, canMuteUser, canRemoveUser, canSendMessage, channelMemberActionSet],
  );
};

const SendDirectMessageAction = () => {
  const { client, setActiveChannel } = useChatContext();
  const { setChannels } = useChannelListContext();
  const { close } = useModalContext();
  const { channel } = useChannelDetailContext();
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();
  const { targetUserId } = useChannelMemberActionContext();
  const [isSending, setIsSending] = useState(false);

  const openDirectMessage = useCallback(async () => {
    if (!client.userID || !targetUserId || isSending) return;

    setIsSending(true);
    try {
      const directMessageChannel = client.channel(channel.type, {
        members: [client.userID, targetUserId],
      });
      await directMessageChannel.watch();
      setActiveChannel(directMessageChannel);
      setChannels?.((channels) => uniqBy([directMessageChannel, ...channels], 'cid'));
      close();
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: 'ChannelMemberDetail',
        error: toError(error),
        message: t('Error opening direct message'),
        severity: 'error',
        type: 'api:channel:watch:failed',
      });
    } finally {
      setIsSending(false);
    }
  }, [
    addNotification,
    channel,
    client,
    close,
    isSending,
    setActiveChannel,
    setChannels,
    t,
    targetUserId,
  ]);

  const rootProps = useMemo(
    () => ({
      className: channelMemberDetailActionClassName,
      disabled: isSending,
      onClick: openDirectMessage,
    }),
    [isSending, openDirectMessage],
  );

  return (
    <ListItemLayout
      LeadingIcon={SendDirectMessageActionIcon}
      RootElement='button'
      rootProps={rootProps}
      title={t('Send direct message')}
    />
  );
};

const UserMuteAction = () => {
  const { channel } = useChannelDetailContext();
  const { client, mutes } = useChatContext();
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();
  const { targetUserId } = useChannelMemberActionContext();
  const userMuted =
    !!targetUserId && mutes.some((mute) => mute.target.id === targetUserId);
  const [optimisticUserMuted, setOptimisticUserMuted] = useState(userMuted);

  useEffect(() => {
    setOptimisticUserMuted(userMuted);
  }, [userMuted]);

  const toggleUserMuteRequest = useStableCallback(
    (nextMuted: boolean, userId?: string) => {
      if (!userId) return;

      if (!nextMuted) {
        return client
          .unmuteUser(userId)
          .then(() =>
            addNotification({
              context: { channel },
              emitter: 'ChannelMemberDetail',
              message: t('User unmuted'),
              severity: 'success',
              type: 'api:user:unmute:success',
            }),
          )
          .catch((error) => {
            // Reconcile to the truth source rather than a hard-coded value: with
            // the debounced request, optimistic state may have flipped multiple
            // times, so a fixed boolean can land on the wrong state.
            setOptimisticUserMuted(userMuted);
            return addNotification({
              context: { channel },
              emitter: 'ChannelMemberDetail',
              error: toError(error),
              message: t('Error unmuting user'),
              severity: 'error',
              type: 'api:user:unmute:failed',
            });
          });
      }

      return client
        .muteUser(userId)
        .then(() =>
          addNotification({
            context: { channel },
            emitter: 'ChannelMemberDetail',
            message: t('User muted'),
            severity: 'success',
            type: 'api:user:mute:success',
          }),
        )
        .catch((error) => {
          setOptimisticUserMuted(userMuted);
          return addNotification({
            context: { channel },
            emitter: 'ChannelMemberDetail',
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
    toggleUserMute(nextMuted, targetUserId);
  }, [optimisticUserMuted, targetUserId, toggleUserMute]);

  const rootProps = useMemo(
    () => ({
      'aria-pressed': optimisticUserMuted,
      className: clsx('str-chat__form__switch-field', channelMemberDetailActionClassName),
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
      LeadingIcon={optimisticUserMuted ? MemberUnmuteActionIcon : MemberMuteActionIcon}
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
  const { memberDisplayName, targetUserId } = useChannelMemberActionContext();
  const { userIds: blockedUserIds } = useStateStore(
    client.blockedUsers,
    blockedUsersSelector,
  );
  const isBlocked = !!targetUserId && new Set(blockedUserIds).has(targetUserId);
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
        emitter: 'ChannelMemberDetail',
        message: t('User unblocked'),
        severity: 'success',
        type: 'api:user:unblock:success',
      });
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: 'ChannelMemberDetail',
        error: toError(error),
        message: t('Error unblocking user'),
        severity: 'error',
        type: 'api:user:unblock:failed',
      });
    } finally {
      setAlertOpen(false);
      setUserBlockInProgress(false);
    }
  }, [addNotification, channel, client, t, targetUserId]);

  const blockUser = useCallback(async () => {
    if (!targetUserId) return;

    try {
      setUserBlockInProgress(true);
      await client.blockUser(targetUserId);
      addNotification({
        context: { channel },
        emitter: 'ChannelMemberDetail',
        message: t('User blocked'),
        severity: 'success',
        type: 'api:user:block:success',
      });
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: 'ChannelMemberDetail',
        error: toError(error),
        message: t('Error blocking user'),
        severity: 'error',
        type: 'api:user:block:failed',
      });
    } finally {
      setAlertOpen(false);
      setUserBlockInProgress(false);
    }
  }, [addNotification, channel, client, t, targetUserId]);

  const rootProps = useMemo(
    () => ({
      className: channelMemberDetailActionClassName,
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
        title={isBlocked ? t('Unblock user') : t('Block user')}
      />
      <Modal open={alertOpen} role='alertdialog'>
        <ChannelMemberConfirmationAlert
          action='blockUser'
          cancelLabel={t('Cancel')}
          confirmLabel={isBlocked ? t('Unblock user') : t('Block user')}
          description={
            isBlocked
              ? t('{{ member }} will be able to message you again.', {
                  member: memberDisplayName,
                })
              : t("{{ member }} won't be able to message you anymore.", {
                  member: memberDisplayName,
                })
          }
          isSubmitting={userBlockInProgress}
          onCancel={closeBlockUserAlert}
          onConfirm={isBlocked ? unblockUser : blockUser}
          testId='channel-detail-block-member-alert'
          title={isBlocked ? t('Unblock user') : t('Block user')}
        />
      </Modal>
    </>
  );
};

const RemoveUserAction = () => {
  const { Modal = GlobalModal } = useComponentContext();
  const { channel } = useChannelDetailContext();
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();
  const { memberDisplayName, targetUserId } = useChannelMemberActionContext();
  const [alertOpen, setAlertOpen] = useState(false);
  const [removeMemberInProgress, setRemoveMemberInProgress] = useState(false);

  const closeRemoveUserAlert = useCallback(() => {
    setAlertOpen(false);
  }, []);

  const openRemoveUserAlert = useCallback(() => {
    setAlertOpen(true);
  }, []);

  const removeUser = useCallback(async () => {
    if (!targetUserId) return;

    try {
      setRemoveMemberInProgress(true);
      await channel.removeMembers([targetUserId]);
      addNotification({
        context: { channel },
        emitter: 'ChannelMemberDetail',
        message: t('User removed'),
        severity: 'success',
        type: 'api:channel:remove-members:success',
      });
      setAlertOpen(false);
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: 'ChannelMemberDetail',
        error: toError(error),
        message: t('Error removing user'),
        severity: 'error',
        type: 'api:channel:remove-members:failed',
      });
    } finally {
      setRemoveMemberInProgress(false);
    }
  }, [addNotification, channel, t, targetUserId]);

  const rootProps = useMemo(
    () => ({
      className: channelMemberDetailActionClassName,
      disabled: removeMemberInProgress,
      onClick: openRemoveUserAlert,
    }),
    [openRemoveUserAlert, removeMemberInProgress],
  );

  return (
    <>
      <ListItemLayout
        destructive
        LeadingIcon={RemoveUserActionIcon}
        RootElement='button'
        rootProps={rootProps}
        title={t('Remove user')}
      />
      <Modal open={alertOpen} role='alertdialog'>
        <ChannelMemberConfirmationAlert
          action='removeUser'
          cancelLabel={t('Cancel')}
          confirmLabel={t('Remove user')}
          description={t('Remove {{ member }} from this channel?', {
            member: memberDisplayName,
          })}
          isSubmitting={removeMemberInProgress}
          onCancel={closeRemoveUserAlert}
          onConfirm={removeUser}
          testId='channel-detail-remove-member-alert'
          title={t('Remove user')}
        />
      </Modal>
    </>
  );
};

export const DefaultChannelMemberActions = {
  BlockUser: BlockUserAction,
  MuteUser: UserMuteAction,
  RemoveUser: RemoveUserAction,
  SendDirectMessage: SendDirectMessageAction,
};

export const defaultChannelMemberActionSet: ChannelMemberActionItem[] = [
  {
    Component: DefaultChannelMemberActions.SendDirectMessage,
    type: 'sendMessage',
  },
  {
    Component: DefaultChannelMemberActions.MuteUser,
    type: 'muteUser',
  },
  {
    Component: DefaultChannelMemberActions.BlockUser,
    type: 'blockUser',
  },
  {
    Component: DefaultChannelMemberActions.RemoveUser,
    type: 'removeUser',
  },
];
