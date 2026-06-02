import React, { useCallback, useMemo, useState } from 'react';
import debounce from 'lodash.debounce';

import {
  useChannelStateContext,
  useChatContext,
  useModalContext,
  useTranslationContext,
} from '../../../context';
import { isDmChannel } from '../../../utils';
import { ListItemButton } from '../../Button';
import { useIsChannelMuted } from '../../ChannelListItem/hooks/useIsChannelMuted';
import { SwitchField } from '../../Form';
import { IconAudio, IconDelete, IconLeave, IconMute, IconNoSign } from '../../Icons';
import { useNotificationApi } from '../../Notifications';

export type ChannelInfoActionType =
  | 'blockUser'
  | 'deleteChat'
  | 'leaveChannel'
  | 'muteChannel'
  | 'muteUser'
  | (string & {});

export type ChannelInfoActionItem = {
  Component: React.ComponentType;
  type: ChannelInfoActionType;
};

const toError = (error: unknown) =>
  error instanceof Error ? error : new Error('An unknown error occurred');

const useOtherMember = () => {
  const { client } = useChatContext();
  const { channel } = useChannelStateContext();

  return useMemo(
    () =>
      channel.data?.members?.find(
        (member) => member.user?.id && member.user.id !== client.user?.id,
      ),
    [channel, client.user?.id],
  );
};

const useChannelInfoActionFilterState = () => {
  const { client } = useChatContext();
  const { channel } = useChannelStateContext();
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

export const useBaseChannelInfoActionSetFilter = (
  channelInfoActionSet: ChannelInfoActionItem[],
) => {
  const { canBlockUser, canLeaveChannel, canMuteChannel, canMuteUser } =
    useChannelInfoActionFilterState();

  return useMemo(
    () =>
      channelInfoActionSet.filter((action) => {
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
    [canBlockUser, canLeaveChannel, canMuteChannel, canMuteUser, channelInfoActionSet],
  );
};

const ChannelMuteAction = () => {
  const { channel } = useChannelStateContext();
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();
  const { muted: channelMuted } = useIsChannelMuted(channel);

  const toggleChannelMute = useMemo(
    () =>
      debounce(() => {
        if (channelMuted) {
          return channel
            .unmute()
            .then(() =>
              addNotification({
                context: { channel },
                emitter: 'ChannelManagementView',
                message: t('Channel unmuted'),
                severity: 'success',
                type: 'api:channel:unmute:success',
              }),
            )
            .catch((error) =>
              addNotification({
                context: { channel },
                emitter: 'ChannelManagementView',
                error: toError(error),
                message: t('Error unmuting channel'),
                severity: 'error',
                type: 'api:channel:unmute:failed',
              }),
            );
        }

        return channel
          .mute()
          .then(() =>
            addNotification({
              context: { channel },
              emitter: 'ChannelManagementView',
              message: t('Channel muted'),
              severity: 'success',
              type: 'api:channel:mute:success',
            }),
          )
          .catch((error) =>
            addNotification({
              context: { channel },
              emitter: 'ChannelManagementView',
              error: toError(error),
              message: t('Error muting channel'),
              severity: 'error',
              type: 'api:channel:mute:failed',
            }),
          );
      }, 1000),
    [addNotification, channel, channelMuted, t],
  );

  return (
    <SwitchField
      checked={channelMuted}
      Icon={channelMuted ? IconAudio : IconMute}
      id='channel-mute-switch'
      onChange={toggleChannelMute}
      title={channelMuted ? t('Unmute chat') : t('Mute chat')}
    />
  );
};

const UserMuteAction = () => {
  const { client, mutes } = useChatContext();
  const { channel } = useChannelStateContext();
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();
  const otherMember = useOtherMember();
  const userMuted = !!mutes.find((mute) => mute.target.id === otherMember?.user?.id);

  const toggleUserMute = useMemo(
    () =>
      debounce(() => {
        if (!otherMember?.user?.id) return;

        if (userMuted) {
          return client
            .unmuteUser(otherMember.user.id)
            .then(() =>
              addNotification({
                context: { channel },
                emitter: 'ChannelManagementView',
                message: t('User unmuted'),
                severity: 'success',
                type: 'api:user:unmute:success',
              }),
            )
            .catch((error) =>
              addNotification({
                context: { channel },
                emitter: 'ChannelManagementView',
                error: toError(error),
                message: t('Error unmuting user'),
                severity: 'error',
                type: 'api:user:unmute:failed',
              }),
            );
        }

        return client
          .muteUser(otherMember.user.id)
          .then(() =>
            addNotification({
              context: { channel },
              emitter: 'ChannelManagementView',
              message: t('User muted'),
              severity: 'success',
              type: 'api:user:mute:success',
            }),
          )
          .catch((error) =>
            addNotification({
              context: { channel },
              emitter: 'ChannelManagementView',
              error: toError(error),
              message: t('Error muting user'),
              severity: 'error',
              type: 'api:user:mute:failed',
            }),
          );
      }, 1000),
    [addNotification, channel, client, otherMember, t, userMuted],
  );

  return (
    <SwitchField
      checked={userMuted}
      Icon={userMuted ? IconAudio : IconMute}
      id='user-mute-switch'
      onChange={toggleUserMute}
      title={userMuted ? t('Unmute user') : t('Mute user')}
    />
  );
};

const BlockUserAction = () => {
  const { client } = useChatContext();
  const { channel } = useChannelStateContext();
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();
  const otherMember = useOtherMember();
  const [userBlockInProgress, setUserBlockInProgress] = useState(false);

  const blockUser = useCallback(async () => {
    if (!otherMember?.user?.id) return;

    try {
      setUserBlockInProgress(true);
      await client.blockUser(otherMember.user.id);
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
      setUserBlockInProgress(false);
    }
  }, [addNotification, channel, client, otherMember, t]);

  return (
    <ListItemButton
      destructive
      disabled={userBlockInProgress}
      LeadingIcon={IconNoSign}
      onClick={blockUser}
      title={t('Block user')}
    />
  );
};

const LeaveChannelAction = () => {
  const { client } = useChatContext();
  const { channel } = useChannelStateContext();
  const { close } = useModalContext();
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();
  const [leaveChannelInProgress, setLeaveChannelInProgress] = useState(false);

  const leaveChannel = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
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
    },
    [addNotification, channel, client.userID, close, t],
  );

  return (
    <ListItemButton
      destructive
      disabled={leaveChannelInProgress}
      LeadingIcon={IconLeave}
      onClick={leaveChannel}
      title={t('Leave Channel')}
    />
  );
};

const DeleteChatAction = () => {
  const { t } = useTranslationContext();

  return <ListItemButton destructive LeadingIcon={IconDelete} title={t('Delete chat')} />;
};

export const DefaultChannelInfoActions = {
  BlockUser: BlockUserAction,
  DeleteChat: DeleteChatAction,
  LeaveChannel: LeaveChannelAction,
  MuteChannel: ChannelMuteAction,
  MuteUser: UserMuteAction,
};

export const defaultChannelInfoActionSet: ChannelInfoActionItem[] = [
  {
    Component: DefaultChannelInfoActions.MuteChannel,
    type: 'muteChannel',
  },
  {
    Component: DefaultChannelInfoActions.MuteUser,
    type: 'muteUser',
  },
  {
    Component: DefaultChannelInfoActions.BlockUser,
    type: 'blockUser',
  },
  {
    Component: DefaultChannelInfoActions.LeaveChannel,
    type: 'leaveChannel',
  },
  {
    Component: DefaultChannelInfoActions.DeleteChat,
    type: 'deleteChat',
  },
];
