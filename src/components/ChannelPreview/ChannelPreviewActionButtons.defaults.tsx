/* eslint-disable sort-keys */
import { type ComponentPropsWithoutRef, useMemo, useState } from 'react';

import { useChatContext, useTranslationContext } from '../../context';
import { useChannelMembershipState } from '../ChannelList';
import { useChannelPreviewContext } from './ChannelPreview';
import { Button } from '../Button';
import {
  IconArchive,
  IconArrowBoxLeft,
  IconCircleBanSign,
  IconMute,
  IconPin,
} from '../Icons';
import { useIsChannelMuted } from './hooks/useIsChannelMuted';
import { ContextMenuButton, useDialogOnNearestManager } from '../Dialog';
import { ChannelPreviewActionButtons } from './ChannelPreviewActionButtons';

const useMuteActionButtonBehavior = () => {
  const { client } = useChatContext();
  const { channel } = useChannelPreviewContext();
  const { t } = useTranslationContext();
  const { muted: isMuted } = useIsChannelMuted(channel);
  const [inProgress, setInProgress] = useState(false);

  return {
    title: isMuted ? t('Unmute') : t('Mute'),
    'aria-pressed': isMuted,
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
          message: 'Failed to update channel mute status',
          origin: {
            emitter: ChannelPreviewActionButtons.name,
          },
          options: {
            originalError:
              error instanceof Error ? error : new Error('An unknown error occurred'),
          },
        });
      } finally {
        setInProgress(false);
      }
    },
    disabled: inProgress,
  } satisfies ComponentPropsWithoutRef<'button'>;
};

const useArchiveActionButtonBehavior = () => {
  const { channel } = useChannelPreviewContext();
  const { client } = useChatContext();
  const membership = useChannelMembershipState(channel);
  const { t } = useTranslationContext();
  const [inProgress, setInProgress] = useState(false);

  return {
    title: membership.archived_at ? t('Unarchive') : t('Archive'),
    'aria-pressed': typeof membership.archived_at === 'string',
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
          message: 'Failed to update channel archive status',
          origin: {
            emitter: ChannelPreviewActionButtons.name,
          },
          options: {
            originalError:
              error instanceof Error ? error : new Error('An unknown error occurred'),
          },
        });
      } finally {
        setInProgress(false);
      }
    },
    disabled: inProgress,
  } satisfies ComponentPropsWithoutRef<'button'>;
};

type ChannelActionItem = ({ placement: 'quick' } | { placement: 'dropdown' }) & {
  Component: React.ComponentType;
  type: string;
};

export const defaultChannelActionSet: ChannelActionItem[] = [
  {
    type: 'archive',
    placement: 'quick',
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
  },
  {
    type: 'mute',
    placement: 'quick',
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
  },
  {
    type: 'archive',
    placement: 'dropdown',
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
  },
  {
    type: 'mute',
    placement: 'dropdown',
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
  },
  {
    // TODO: finalize (add unban check & behavior)
    type: 'ban',
    placement: 'dropdown',
    Component() {
      const { client } = useChatContext();
      const { t } = useTranslationContext();
      const { channel } = useChannelPreviewContext();
      const [inProgress, setInProgress] = useState(false);

      return (
        <ContextMenuButton
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

              await Promise.all([
                channel.banUser(otherUserId, {}),
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                channel.removeMembers([client.userID!]),
              ]);
            } catch (error) {
              client.notifications.addError({
                message: 'Failed to ban user',
                origin: {
                  emitter: ChannelPreviewActionButtons.name,
                },
                options: {
                  originalError:
                    error instanceof Error
                      ? error
                      : new Error('An unknown error occurred'),
                },
              });
            } finally {
              setInProgress(false);
            }
          }}
        >
          {t('Block User')}
        </ContextMenuButton>
      );
    },
  },
  {
    type: 'pin',
    placement: 'dropdown',
    Component() {
      const { t } = useTranslationContext();
      const { client } = useChatContext();
      const { channel } = useChannelPreviewContext();
      const membership = useChannelMembershipState(channel);
      const dialogId = ChannelPreviewActionButtons.getDialogId(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        channel.id!,
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
              } else {
                await channel.pin();
              }
            } catch (e) {
              error = e instanceof Error ? e : new Error('An unknown error occurred');
              client.notifications.addError({
                message: 'Failed to update channel pinned status',
                origin: {
                  emitter: ChannelPreviewActionButtons.name,
                },
                options: {
                  originalError: error,
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
  },
  {
    type: 'leave',
    placement: 'dropdown',
    Component() {
      const { t } = useTranslationContext();
      const { channel } = useChannelPreviewContext();
      const { client } = useChatContext();
      const [inProgress, setInProgress] = useState(false);

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
                message: 'Failed to leave channel',
                origin: {
                  emitter: ChannelPreviewActionButtons.name,
                },
                options: {
                  originalError:
                    error instanceof Error
                      ? error
                      : new Error('An unknown error occurred'),
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
  },
];

export const useBaseChannelActionSetFilter = (channelActionSet: ChannelActionItem[]) => {
  const { channel } = useChannelPreviewContext();
  const isDirectMessageChannel =
    channel.type === 'messaging' &&
    // assuming one of the users is current user
    channel.data?.member_count === 2 &&
    channel.id?.startsWith('!members-');
  const memberCount = channel.data?.member_count ?? 0;

  const ownCapabilities = channel.data?.own_capabilities;

  return useMemo(() => {
    const filtered: ChannelActionItem[] = [];

    for (const action of channelActionSet) {
      if (action.type === 'archive') {
        if (
          (action.placement === 'dropdown' && isDirectMessageChannel) ||
          (action.placement === 'quick' && !isDirectMessageChannel)
        )
          continue;
        filtered.push(action);
      } else if (action.type === 'mute') {
        if (
          (action.placement === 'dropdown' && !isDirectMessageChannel) ||
          (action.placement === 'quick' && isDirectMessageChannel)
        )
          continue;
        filtered.push(action);
      } else if (action.type === 'ban') {
        if (!ownCapabilities?.includes('ban-channel-members') || memberCount > 2)
          continue;
        filtered.push(action);
      } else if (action.type === 'pin') {
        filtered.push(action);
      } else if (action.type === 'leave') {
        if (!ownCapabilities?.includes('leave-channel')) continue;
        filtered.push(action);
      }
    }

    return filtered;
  }, [channelActionSet, isDirectMessageChannel, memberCount, ownCapabilities]);
};
