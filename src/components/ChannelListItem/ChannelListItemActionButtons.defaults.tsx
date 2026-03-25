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
  IconArrowBoxLeft,
  IconCircleBanSign,
  IconDotGrid1x3Horizontal,
  IconMute,
  IconPin,
} from '../Icons';
import { useIsChannelMuted } from './hooks/useIsChannelMuted';
import { ContextMenuButton, useDialogIsOpen, useDialogOnNearestManager } from '../Dialog';
import { addNotificationTargetTag, useNotificationTarget } from '../Notifications';
import { ChannelListItemActionButtons } from './ChannelListItemActionButtons';

const useMuteActionButtonBehavior = () => {
  const { client } = useChatContext();
  const { channel } = useChannelListItemContext();
  const { t } = useTranslationContext();
  const { muted: isMuted } = useIsChannelMuted(channel);
  const [inProgress, setInProgress] = useState(false);
  const panel = useNotificationTarget();

  return {
    'aria-pressed': isMuted,
    disabled: inProgress,
    onClick: async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      try {
        setInProgress(true);
        if (isMuted) {
          await channel.unmute();
        } else {
          await channel.mute();
        }
      } catch (error) {
        client.notifications.addError({
          message: t('Failed to update channel mute status'),
          options: {
            originalError:
              error instanceof Error ? error : new Error('An unknown error occurred'),
            tags: addNotificationTargetTag(panel),
            type: 'channelListItem:mute:failed',
          },
          origin: {
            emitter: ChannelListItemActionButtons.name,
          },
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
  const { client } = useChatContext();
  const membership = useChannelMembershipState(channel);
  const { t } = useTranslationContext();
  const [inProgress, setInProgress] = useState(false);
  const panel = useNotificationTarget();

  return {
    'aria-pressed': typeof membership.archived_at === 'string',
    disabled: inProgress,
    onClick: async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      try {
        setInProgress(true);
        if (membership.archived_at) {
          await channel.unarchive();
        } else {
          await channel.archive();
        }
      } catch (error) {
        client.notifications.addError({
          message: t('Failed to update channel archive status'),
          options: {
            originalError:
              error instanceof Error ? error : new Error('An unknown error occurred'),
            tags: addNotificationTargetTag(panel),
            type: 'channelListItem:archive:failed',
          },
          origin: {
            emitter: ChannelListItemActionButtons.name,
          },
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

export const defaultChannelActionSet: ChannelActionItem[] = [
  {
    // eslint-disable-next-line react/display-name
    Component: forwardRef<HTMLButtonElement>((_, ref) => {
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
          <IconDotGrid1x3Horizontal />
        </Button>
      );
    }),
    placement: 'quick-dropdown-toggle',
  },
  {
    Component() {
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
    placement: 'quick',
    type: 'archive',
  },
  {
    Component() {
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
    placement: 'quick',
    type: 'mute',
  },
  {
    Component() {
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
    placement: 'dropdown',
    type: 'archive',
  },
  {
    Component() {
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
    placement: 'dropdown',
    type: 'mute',
  },
  {
    Component() {
      const { client } = useChatContext();
      const { t } = useTranslationContext();
      const { channel } = useChannelListItemContext();
      const [inProgress, setInProgress] = useState(false);
      const members = useChannelMembersState(channel);
      const panel = useNotificationTarget();
      const isUserBanned = Object.values(members || {}).some(
        (member) => member.user?.id !== client.userID && member.banned,
      );

      const title = isUserBanned ? t('Unblock User') : t('Block User');

      return (
        <ContextMenuButton
          aria-label={title}
          disabled={inProgress}
          Icon={IconCircleBanSign}
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
              } else {
                await channel.banUser(otherUserId, {});
              }
            } catch (error) {
              client.notifications.addError({
                message: t('Failed to block user'),
                options: {
                  originalError:
                    error instanceof Error
                      ? error
                      : new Error('An unknown error occurred'),
                  tags: addNotificationTargetTag(panel),
                  type: 'channelListItem:ban:failed',
                },
                origin: {
                  emitter: ChannelListItemActionButtons.name,
                },
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
    placement: 'dropdown',
    type: 'ban',
  },
  {
    Component() {
      const { t } = useTranslationContext();
      const { client } = useChatContext();
      const { channel } = useChannelListItemContext();
      const membership = useChannelMembershipState(channel);
      const dialogId = ChannelListItemActionButtons.getDialogId(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        { channelId: channel.id! },
      );
      const { dialog } = useDialogOnNearestManager({ id: dialogId });
      const [inProgress, setInProgress] = useState(false);
      const panel = useNotificationTarget();

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
              } else {
                await channel.pin();
              }
            } catch (e) {
              error = e instanceof Error ? e : new Error('An unknown error occurred');
              client.notifications.addError({
                message: t('Failed to update channel pinned status'),
                options: {
                  originalError: error,
                  tags: addNotificationTargetTag(panel),
                  type: 'channelListItem:pin:failed',
                },
                origin: {
                  emitter: ChannelListItemActionButtons.name,
                },
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
    placement: 'dropdown',
    type: 'pin',
  },
  {
    Component() {
      const { t } = useTranslationContext();
      const { channel } = useChannelListItemContext();
      const { client } = useChatContext();
      const [inProgress, setInProgress] = useState(false);
      const panel = useNotificationTarget();

      const title = t('Leave Channel');

      return (
        <ContextMenuButton
          aria-label={title}
          disabled={inProgress}
          Icon={IconArrowBoxLeft}
          onClick={async (e) => {
            e.stopPropagation();
            try {
              setInProgress(true);
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              await channel.removeMembers([client.userID!]);
            } catch (error) {
              client.notifications.addError({
                message: t('Failed to leave channel'),
                options: {
                  originalError:
                    error instanceof Error
                      ? error
                      : new Error('An unknown error occurred'),
                  tags: addNotificationTargetTag(panel),
                  type: 'channelListItem:leave:failed',
                },
                origin: {
                  emitter: ChannelListItemActionButtons.name,
                },
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
    placement: 'dropdown',
    type: 'leave',
  },
];

export const useBaseChannelActionSetFilter = (channelActionSet: ChannelActionItem[]) => {
  const { channel } = useChannelListItemContext();
  const membership = useChannelMembershipState(channel);
  const isDirectMessageChannel =
    channel.type === 'messaging' &&
    // assuming one of the users is current user
    channel.data?.member_count === 2 &&
    channel.id?.startsWith('!members-');
  const memberCount = channel.data?.member_count ?? 0;
  const connectedUserIsMember = typeof membership.user !== 'undefined';

  const ownCapabilities = channel.data?.own_capabilities;

  return useMemo(() => {
    const filtered = channelActionSet.filter((action) => {
      if (action.placement === 'quick-dropdown-toggle') return true;

      switch (action.type) {
        case 'archive':
          return (
            connectedUserIsMember &&
            ((action.placement === 'quick' && isDirectMessageChannel) ||
              (action.placement === 'dropdown' && !isDirectMessageChannel))
          );
        case 'mute':
          return (
            ownCapabilities?.includes('mute-channel') &&
            ((action.placement === 'dropdown' && isDirectMessageChannel) ||
              (action.placement === 'quick' && !isDirectMessageChannel))
          );
        case 'ban':
          return (
            memberCount > 0 &&
            memberCount <= 2 &&
            ownCapabilities?.includes('ban-channel-members')
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
  }, [
    channelActionSet,
    isDirectMessageChannel,
    memberCount,
    ownCapabilities,
    connectedUserIsMember,
  ]);
};
