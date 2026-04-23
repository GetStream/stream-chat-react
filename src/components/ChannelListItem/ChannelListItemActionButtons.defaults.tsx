import {
  type ComponentPropsWithoutRef,
  type ComponentPropsWithRef,
  forwardRef,
  useMemo,
  useState,
} from 'react';

import { useChatContext, useTranslationContext } from '../../context';
import { useChannelMembershipState, useChannelMembersState } from '../ChannelList';
import { useChannelListItemContext } from './ChannelListItem';
import { Button } from '../Button';
import {
  IconArchive,
  IconLeave,
  IconMore,
  IconMute,
  IconNoSign,
  IconPin,
} from '../Icons';
import { useIsChannelMuted } from './hooks/useIsChannelMuted';
import { ContextMenuButton, useDialogIsOpen, useDialogOnNearestManager } from '../Dialog';
import { useNotificationApi } from '../Notifications';
import { ChannelListItemActionButtons } from './ChannelListItemActionButtons';

const useMuteActionButtonBehavior = () => {
  const { addNotification } = useNotificationApi();
  const { channel } = useChannelListItemContext();
  const { t } = useTranslationContext();
  const { muted: isMuted } = useIsChannelMuted(channel);
  const [inProgress, setInProgress] = useState(false);

  return {
    'aria-pressed': isMuted,
    disabled: inProgress,
    onClick: async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      try {
        setInProgress(true);
        if (isMuted) {
          await channel.unmute();
          addNotification({
            context: {
              channel,
            },
            emitter: ChannelListItemActionButtons.name,
            message: t('Channel unmuted'),
            severity: 'success',
            type: 'api:channel:unmute:success',
          });
        } else {
          await channel.mute();
          addNotification({
            context: {
              channel,
            },
            emitter: ChannelListItemActionButtons.name,
            message: t('Channel muted'),
            severity: 'success',
            type: 'api:channel:mute:success',
          });
        }
      } catch (error) {
        addNotification({
          context: {
            channel,
          },
          emitter: ChannelListItemActionButtons.name,
          error: error instanceof Error ? error : new Error('An unknown error occurred'),
          message: t('Failed to update channel mute status'),
          severity: 'error',
          type: 'api:channel:mute:failed',
        });
      } finally {
        setInProgress(false);
      }
    },
    title: isMuted ? t('Unmute') : t('Mute'),
  } satisfies ComponentPropsWithoutRef<'button'>;
};

const useArchiveActionButtonBehavior = () => {
  const { channel } = useChannelListItemContext();
  const { addNotification } = useNotificationApi();
  const membership = useChannelMembershipState(channel);
  const { t } = useTranslationContext();
  const [inProgress, setInProgress] = useState(false);

  return {
    'aria-pressed': typeof membership.archived_at === 'string',
    disabled: inProgress,
    onClick: async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      try {
        setInProgress(true);
        if (membership.archived_at) {
          await channel.unarchive();
          addNotification({
            context: {
              channel,
            },
            emitter: ChannelListItemActionButtons.name,
            message: t('Channel unarchived'),
            severity: 'success',
            type: 'api:channel:unarchive:success',
          });
        } else {
          await channel.archive();
          addNotification({
            context: {
              channel,
            },
            emitter: ChannelListItemActionButtons.name,
            message: t('Channel archived'),
            severity: 'success',
            type: 'api:channel:archive:success',
          });
        }
      } catch (error) {
        addNotification({
          context: {
            channel,
          },
          emitter: ChannelListItemActionButtons.name,
          error: error instanceof Error ? error : new Error('An unknown error occurred'),
          message: t('Failed to update channel archive status'),
          severity: 'error',
          type: 'api:channel:archive:failed',
        });
      } finally {
        setInProgress(false);
      }
    },
    title: membership.archived_at ? t('Unarchive') : t('Archive'),
  } satisfies ComponentPropsWithoutRef<'button'>;
};

type ChannelActionItem =
  | (({ placement: 'quick' } | { placement: 'dropdown' }) & {
      type: string;
      Component: React.ComponentType;
    })
  | {
      placement: 'quick-dropdown-toggle';
      Component: React.ComponentType<ComponentPropsWithRef<'button'>>;
    };

const defaultComponents = {
  dropdown: {
    Archive() {
      const behaviorProps = useArchiveActionButtonBehavior();

      return (
        <ContextMenuButton
          aria-label={behaviorProps.title}
          Icon={IconArchive}
          {...behaviorProps}
        >
          {behaviorProps.title}
        </ContextMenuButton>
      );
    },
    Ban() {
      const { client } = useChatContext();
      const { addNotification } = useNotificationApi();
      const { t } = useTranslationContext();
      const { channel } = useChannelListItemContext();
      const [inProgress, setInProgress] = useState(false);
      const members = useChannelMembersState(channel);
      const isUserBanned = Object.values(members || {}).some(
        (member) => member.user?.id !== client.userID && member.banned,
      );

      const title = isUserBanned ? t('Unblock User') : t('Block User');

      return (
        <ContextMenuButton
          aria-label={title}
          disabled={inProgress}
          Icon={IconNoSign}
          onClick={async () => {
            try {
              setInProgress(true);
              const otherUserId = Object.keys(channel.state.members).find(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                (userId) => userId !== client.userID!,
              );

              if (!otherUserId) return;

              if (isUserBanned) {
                await channel.unbanUser(otherUserId);
                addNotification({
                  context: {
                    channel,
                  },
                  emitter: ChannelListItemActionButtons.name,
                  message: t('User unblocked'),
                  severity: 'success',
                  type: 'api:user:unban:success',
                });
              } else {
                await channel.banUser(otherUserId, {});
                addNotification({
                  context: {
                    channel,
                  },
                  emitter: ChannelListItemActionButtons.name,
                  message: t('User blocked'),
                  severity: 'success',
                  type: 'api:user:ban:success',
                });
              }
            } catch (error) {
              addNotification({
                context: {
                  channel,
                },
                emitter: ChannelListItemActionButtons.name,
                error:
                  error instanceof Error ? error : new Error('An unknown error occurred'),
                message: t('Failed to block user'),
                severity: 'error',
                type: 'api:user:ban:failed',
              });
            } finally {
              setInProgress(false);
            }
          }}
        >
          {title}
        </ContextMenuButton>
      );
    },
    Leave() {
      const { t } = useTranslationContext();
      const { channel } = useChannelListItemContext();
      const { client } = useChatContext();
      const { addNotification } = useNotificationApi();
      const [inProgress, setInProgress] = useState(false);

      const title = t('Leave Channel');

      return (
        <ContextMenuButton
          aria-label={title}
          disabled={inProgress}
          Icon={IconLeave}
          onClick={async (e) => {
            e.stopPropagation();
            try {
              setInProgress(true);
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              await channel.removeMembers([client.userID!]);
              addNotification({
                context: {
                  channel,
                },
                emitter: ChannelListItemActionButtons.name,
                message: t('Left channel'),
                severity: 'success',
                type: 'api:channel:leave:success',
              });
            } catch (error) {
              addNotification({
                context: {
                  channel,
                },
                emitter: ChannelListItemActionButtons.name,
                error:
                  error instanceof Error ? error : new Error('An unknown error occurred'),
                message: t('Failed to leave channel'),
                severity: 'error',
                type: 'api:channel:leave:failed',
              });
            } finally {
              setInProgress(false);
            }
          }}
          title={title}
          variant='destructive'
        >
          {title}
        </ContextMenuButton>
      );
    },
    Mute() {
      const behaviorProps = useMuteActionButtonBehavior();

      return (
        <ContextMenuButton
          aria-label={behaviorProps.title}
          Icon={IconMute}
          {...behaviorProps}
        >
          {behaviorProps.title}
        </ContextMenuButton>
      );
    },
    Pin() {
      const { t } = useTranslationContext();
      const { addNotification } = useNotificationApi();
      const { channel } = useChannelListItemContext();
      const membership = useChannelMembershipState(channel);
      const dialogId = ChannelListItemActionButtons.getDialogId(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        { channelId: channel.id! },
      );
      const { dialog } = useDialogOnNearestManager({ id: dialogId });
      const [inProgress, setInProgress] = useState(false);

      const title = membership.pinned_at ? t('Unpin') : t('Pin');

      return (
        <ContextMenuButton
          aria-label={title}
          disabled={inProgress}
          Icon={IconPin}
          onClick={async (e) => {
            e.stopPropagation();
            let error: Error | null = null;
            try {
              setInProgress(true);
              if (membership.pinned_at) {
                await channel.unpin();
                addNotification({
                  context: {
                    channel,
                  },
                  emitter: ChannelListItemActionButtons.name,
                  message: t('Channel unpinned'),
                  severity: 'success',
                  type: 'api:channel:unpin:success',
                });
              } else {
                await channel.pin();
                addNotification({
                  context: {
                    channel,
                  },
                  emitter: ChannelListItemActionButtons.name,
                  message: t('Channel pinned'),
                  severity: 'success',
                  type: 'api:channel:pin:success',
                });
              }
            } catch (e) {
              error = e instanceof Error ? e : new Error('An unknown error occurred');
              addNotification({
                context: {
                  channel,
                },
                emitter: ChannelListItemActionButtons.name,
                error,
                message: t('Failed to update channel pinned status'),
                severity: 'error',
                type: 'api:channel:pin:failed',
              });
            } finally {
              if (!error) dialog?.close();
              setInProgress(false);
            }
          }}
          title={title}
        >
          {title}
        </ContextMenuButton>
      );
    },
  },
  quick: {
    Archive() {
      const behaviorProps = useArchiveActionButtonBehavior();

      return (
        <Button
          appearance='ghost'
          aria-label={behaviorProps.title}
          circular
          size='sm'
          variant='secondary'
          {...behaviorProps}
        >
          <IconArchive />
        </Button>
      );
    },
    Mute() {
      const behaviorProps = useMuteActionButtonBehavior();

      return (
        <Button
          appearance='ghost'
          aria-label={behaviorProps.title}
          circular
          size='sm'
          variant='secondary'
          {...behaviorProps}
        >
          <IconMute />
        </Button>
      );
    },
  },
  QuickDropdownToggle: forwardRef<HTMLButtonElement>((_, ref) => {
    const { channel } = useChannelListItemContext();

    const dialogId = ChannelListItemActionButtons.getDialogId({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      channelId: channel.id!,
    });
    const { dialog, dialogManager } = useDialogOnNearestManager({ id: dialogId });
    const dialogIsOpen = useDialogIsOpen(dialogId, dialogManager?.id);

    return (
      <Button
        appearance='ghost'
        aria-expanded={dialogIsOpen}
        aria-pressed={dialogIsOpen}
        circular
        onClick={(e) => {
          e.stopPropagation();

          dialog.toggle();
        }}
        ref={ref}
        size='sm'
        variant='secondary'
      >
        <IconMore />
      </Button>
    );
  }),
};

defaultComponents.QuickDropdownToggle.displayName = 'QuickDropdownToggle';

export const defaultChannelActionSet: ChannelActionItem[] = [
  {
    Component: defaultComponents.QuickDropdownToggle,
    placement: 'quick-dropdown-toggle',
  },
  {
    Component: defaultComponents.quick.Mute,
    placement: 'quick',
    type: 'mute',
  },
  {
    Component: defaultComponents.dropdown.Archive,
    placement: 'dropdown',
    type: 'archive',
  },
  {
    Component: defaultComponents.dropdown.Ban,
    placement: 'dropdown',
    type: 'ban',
  },
  {
    Component: defaultComponents.dropdown.Pin,
    placement: 'dropdown',
    type: 'pin',
  },
  {
    Component: defaultComponents.dropdown.Leave,
    placement: 'dropdown',
    type: 'leave',
  },
];

export const useBaseChannelActionSetFilter = (channelActionSet: ChannelActionItem[]) => {
  const { channel } = useChannelListItemContext();
  const membership = useChannelMembershipState(channel);
  const memberCount = channel.data?.member_count ?? 0;
  const connectedUserIsMember = typeof membership.user !== 'undefined';
  const isDirectMessageChannel =
    connectedUserIsMember &&
    memberCount === 2 &&
    channel.type === 'messaging' &&
    channel.id?.startsWith('!members-');

  const ownCapabilities = channel.data?.own_capabilities;

  return useMemo(() => {
    const filtered = channelActionSet.filter((action) => {
      if (action.placement === 'quick-dropdown-toggle') return true;

      switch (action.type) {
        case 'archive':
          return connectedUserIsMember;
        case 'mute':
          return ownCapabilities?.includes('mute-channel');
        case 'ban':
          return (
            isDirectMessageChannel && ownCapabilities?.includes('ban-channel-members')
          );
        case 'leave':
          return ownCapabilities?.includes('leave-channel');
        case 'pin':
          return connectedUserIsMember;
        default:
          return true;
      }
    });

    return filtered;
  }, [channelActionSet, connectedUserIsMember, ownCapabilities, isDirectMessageChannel]);
};
