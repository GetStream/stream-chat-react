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
  const { channel } = useChannelPreviewContext();
  const { t } = useTranslationContext();
  const { muted: isMuted } = useIsChannelMuted(channel);
  const [inProgress, setInProgress] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  return {
    title: isMuted ? t('Unmute') : t('Mute'),
    'aria-pressed': isMuted,
    onClick: async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      try {
        setInProgress(true);
        setError(null);
        if (isMuted) {
          await channel.unmute();
        } else {
          await channel.mute();
        }
      } catch (error) {
        setError(error instanceof Error ? error : new Error('An unknown error occurred'));
      } finally {
        setInProgress(false);
      }
    },
    disabled: inProgress,
    'aria-errormessage': error instanceof Error ? error.message : undefined,
  } satisfies ComponentPropsWithoutRef<'button'>;
};

const useArchiveActionButtonBehavior = () => {
  const { channel } = useChannelPreviewContext();
  const membership = useChannelMembershipState(channel);
  const { t } = useTranslationContext();
  const [inProgress, setInProgress] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  return {
    title: membership.archived_at ? t('Unarchive') : t('Archive'),
    'aria-pressed': typeof membership.archived_at === 'string',
    onClick: async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      try {
        setInProgress(true);
        setError(null);
        if (membership.archived_at) {
          await channel.unarchive();
        } else {
          await channel.archive();
        }
      } catch (error) {
        setError(error instanceof Error ? error : new Error('An unknown error occurred'));
      } finally {
        setInProgress(false);
      }
    },
    disabled: inProgress,
    'aria-errormessage': error?.message ?? undefined,
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
    type: 'ban',
    placement: 'dropdown',
    Component() {
      const { client } = useChatContext();
      const { t } = useTranslationContext();
      const { channel } = useChannelPreviewContext();

      const user = channel.data?.members?.find(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        (member) => member.user?.id !== client.userID!,
      )?.user;

      return (
        <ContextMenuButton
          Icon={IconCircleBanSign}
          onClick={() => {
            if (user) channel.banUser(user.id, {});
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
      const { channel } = useChannelPreviewContext();
      const membership = useChannelMembershipState(channel);
      const dialogId = ChannelPreviewActionButtons.getDialogId(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        channel.id!,
      );
      const { dialog } = useDialogOnNearestManager({ id: dialogId });
      const [inProgress, setInProgress] = useState(false);
      const [error, setError] = useState<Error | null>(null);

      const title = membership.pinned_at ? t('Unpin') : t('Pin');

      return (
        <ContextMenuButton
          aria-errormessage={error?.message ?? undefined}
          aria-label={title}
          disabled={inProgress}
          Icon={IconPin}
          onClick={async (e) => {
            e.stopPropagation();
            let error: Error | null = null;
            try {
              setInProgress(true);
              setError(null);
              if (membership.pinned_at) {
                await channel.unpin();
              } else {
                await channel.pin();
              }
            } catch (e) {
              error = e instanceof Error ? e : new Error('An unknown error occurred');
              setError(error);
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
      const [error, setError] = useState<Error | null>(null);

      const title = t('Leave Channel');

      return (
        <ContextMenuButton
          aria-errormessage={error?.message ?? undefined}
          aria-label={title}
          disabled={inProgress}
          Icon={IconArrowBoxLeft}
          onClick={async (e) => {
            e.stopPropagation();
            try {
              setInProgress(true);
              setError(null);
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              await channel.removeMembers([client.userID!]);
            } catch (error) {
              setError(
                error instanceof Error ? error : new Error('An unknown error occurred'),
              );
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
        if (!ownCapabilities?.includes('ban_users')) continue;
        filtered.push(action);
      } else if (action.type === 'pin') {
        filtered.push(action);
      } else if (action.type === 'leave') {
        if (!ownCapabilities?.includes('leave-channel')) continue;
        filtered.push(action);
      }
    }

    return filtered;
  }, [channelActionSet, isDirectMessageChannel, ownCapabilities]);
};
