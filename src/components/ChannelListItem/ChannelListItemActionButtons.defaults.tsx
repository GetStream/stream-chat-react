import {
  type ComponentPropsWithoutRef,
  type ComponentPropsWithRef,
  forwardRef,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  useChatContext,
  useComponentContext,
  useTranslationContext,
} from '../../context';
import { useChannelMembershipState, useChannelMembersState } from '../ChannelList';
import { useChannelListItemContext } from './ChannelListItem';
import { Button } from '../Button';
import {
  IconArchive as DefaultIconArchive,
  IconLeave as DefaultIconLeave,
  IconMore as DefaultIconMore,
  IconMute as DefaultIconMute,
  IconNoSign as DefaultIconNoSign,
  IconPin as DefaultIconPin,
} from '../Icons';
import { useIsChannelMuted } from './hooks/useIsChannelMuted';
import {
  ContextMenuButton,
  useContextMenuContext,
  useDialogIsOpen,
  useDialogOnNearestManager,
} from '../Dialog';
import { useNotificationApi } from '../Notifications';
import { ChannelListItemActionButtons } from './ChannelListItemActionButtons';

type ChannelActionBehavior = {
  /** Toggle state for actions that have one (mute/archive/pin); omit for one-shot actions (leave). */
  'aria-pressed'?: boolean;
  title: string;
  toggle: () => Promise<void>;
};

// Core mute/unmute action — performs the API call and reports the result. No UI state: the placement
// wrappers below own the busy/disabled affordance and the menu-close behavior.
const useMuteAction = (): ChannelActionBehavior => {
  const { addNotification } = useNotificationApi();
  const { channel } = useChannelListItemContext();
  const { t } = useTranslationContext();
  const { muted: isMuted } = useIsChannelMuted(channel);

  const toggle = async () => {
    try {
      if (isMuted) {
        await channel.unmute();
        addNotification({
          context: { channel },
          emitter: ChannelListItemActionButtons.name,
          message: t('Channel unmuted'),
          severity: 'success',
          type: 'api:channel:unmute:success',
        });
      } else {
        await channel.mute();
        addNotification({
          context: { channel },
          emitter: ChannelListItemActionButtons.name,
          message: t('Channel muted'),
          severity: 'success',
          type: 'api:channel:mute:success',
        });
      }
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: ChannelListItemActionButtons.name,
        error: error instanceof Error ? error : new Error('An unknown error occurred'),
        message: t('Failed to update channel mute status'),
        severity: 'error',
        type: 'api:channel:mute:failed',
      });
    }
  };

  return { 'aria-pressed': isMuted, title: isMuted ? t('Unmute') : t('Mute'), toggle };
};

// Core archive/unarchive action — performs the API call and reports the result.
const useArchiveAction = (): ChannelActionBehavior => {
  const { channel } = useChannelListItemContext();
  const { addNotification } = useNotificationApi();
  const membership = useChannelMembershipState(channel);
  const { t } = useTranslationContext();

  const toggle = async () => {
    try {
      if (membership.archived_at) {
        await channel.unarchive();
        addNotification({
          context: { channel },
          emitter: ChannelListItemActionButtons.name,
          message: t('Channel unarchived'),
          severity: 'success',
          type: 'api:channel:unarchive:success',
        });
      } else {
        await channel.archive();
        addNotification({
          context: { channel },
          emitter: ChannelListItemActionButtons.name,
          message: t('Channel archived'),
          severity: 'success',
          type: 'api:channel:archive:success',
        });
      }
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: ChannelListItemActionButtons.name,
        error: error instanceof Error ? error : new Error('An unknown error occurred'),
        message: t('Failed to update channel archive status'),
        severity: 'error',
        type: 'api:channel:archive:failed',
      });
    }
  };

  return {
    'aria-pressed': typeof membership.archived_at === 'string',
    title: membership.archived_at ? t('Unarchive') : t('Archive'),
    toggle,
  };
};

// Quick (hover/focus-revealed) action button. Marks itself busy with `aria-disabled`/`aria-busy` —
// NOT the native `disabled` attribute, which would blur the button and collapse its hover-revealed
// row, leaving it un-focusable. Keeps focus and guards against re-activation while in flight.
const useQuickActionButtonProps = ({
  'aria-pressed': ariaPressed,
  title,
  toggle,
}: ChannelActionBehavior) => {
  // Ref latch flips synchronously in the handler so two clicks in the same tick (before the
  // `setInProgress(true)` rerender commits) can't both call `toggle()` — the `aria-busy`/
  // `aria-disabled` state only guards after the rerender, which is too late for non-idempotent
  // actions (archive/leave/mute).
  const inProgressRef = useRef(false);
  const [inProgress, setInProgress] = useState(false);

  return {
    'aria-busy': inProgress || undefined,
    'aria-disabled': inProgress || undefined,
    'aria-pressed': ariaPressed,
    onClick: async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (inProgressRef.current) return; // busy: ignore re-activation while in flight
      inProgressRef.current = true;
      try {
        setInProgress(true);
        await toggle();
      } finally {
        inProgressRef.current = false;
        setInProgress(false);
      }
    },
    title,
  } satisfies ComponentPropsWithoutRef<'button'>;
};

// Dropdown menu item. Standard menu behavior: activating closes the menu (which returns focus to the
// toggle) and runs the action in the background, reporting via its notification — so the item needs
// no busy/disabled state, it unmounts with the menu.
//
// The action is deferred to after the close commits, on the next animation frame. The open menu is an
// aria-modal dialog with its OWN `AriaLiveOutlet` (the inert root outlet is ignored by assistive tech
// while it is open); running the action synchronously can route its notification into that outlet
// just as it is torn down — so the notification is never spoken. Deferring lets the menu (and its
// outlet) unmount and focus return to the toggle first, so the notification lands in the root outlet,
// in a calm window after the focus re-read.
const useDropdownActionButtonProps = ({
  'aria-pressed': ariaPressed,
  title,
  toggle,
}: ChannelActionBehavior) => {
  const { closeMenu } = useContextMenuContext();

  return {
    'aria-pressed': ariaPressed,
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      closeMenu();
      requestAnimationFrame(() => void toggle());
    },
    title,
  } satisfies ComponentPropsWithoutRef<'button'>;
};

// Core block/unblock action for the other member of a DM.
const useBanAction = (): ChannelActionBehavior => {
  const { client } = useChatContext();
  const { addNotification } = useNotificationApi();
  const { t } = useTranslationContext();
  const { channel } = useChannelListItemContext();
  const members = useChannelMembersState(channel);
  const isUserBanned = Object.values(members || {}).some(
    (member) => member.user?.id !== client.userID && member.banned,
  );

  const toggle = async () => {
    try {
      const otherUserId = Object.keys(channel.state.members).find(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        (userId) => userId !== client.userID!,
      );
      if (!otherUserId) return;
      if (isUserBanned) {
        await channel.unbanUser(otherUserId);
        addNotification({
          context: { channel },
          emitter: ChannelListItemActionButtons.name,
          message: t('User unblocked'),
          severity: 'success',
          type: 'api:user:unban:success',
        });
      } else {
        await channel.banUser(otherUserId, {});
        addNotification({
          context: { channel },
          emitter: ChannelListItemActionButtons.name,
          message: t('User blocked'),
          severity: 'success',
          type: 'api:user:ban:success',
        });
      }
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: ChannelListItemActionButtons.name,
        error: error instanceof Error ? error : new Error('An unknown error occurred'),
        message: t('Failed to block user'),
        severity: 'error',
        type: 'api:user:ban:failed',
      });
    }
  };

  return {
    'aria-pressed': isUserBanned,
    title: isUserBanned ? t('Unblock User') : t('Block User'),
    toggle,
  };
};

// Core leave-channel action (one-shot — not a toggle).
const useLeaveAction = (): ChannelActionBehavior => {
  const { t } = useTranslationContext();
  const { channel } = useChannelListItemContext();
  const { client } = useChatContext();
  const { addNotification } = useNotificationApi();

  const toggle = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await channel.removeMembers([client.userID!]);
      addNotification({
        context: { channel },
        emitter: ChannelListItemActionButtons.name,
        message: t('Left channel'),
        severity: 'success',
        type: 'api:channel:leave:success',
      });
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: ChannelListItemActionButtons.name,
        error: error instanceof Error ? error : new Error('An unknown error occurred'),
        message: t('Failed to leave channel'),
        severity: 'error',
        type: 'api:channel:leave:failed',
      });
    }
  };

  return { title: t('Leave Channel'), toggle };
};

// Core pin/unpin action.
const usePinAction = (): ChannelActionBehavior => {
  const { t } = useTranslationContext();
  const { addNotification } = useNotificationApi();
  const { channel } = useChannelListItemContext();
  const membership = useChannelMembershipState(channel);

  const toggle = async () => {
    try {
      if (membership.pinned_at) {
        await channel.unpin();
        addNotification({
          context: { channel },
          emitter: ChannelListItemActionButtons.name,
          message: t('Channel unpinned'),
          severity: 'success',
          type: 'api:channel:unpin:success',
        });
      } else {
        await channel.pin();
        addNotification({
          context: { channel },
          emitter: ChannelListItemActionButtons.name,
          message: t('Channel pinned'),
          severity: 'success',
          type: 'api:channel:pin:success',
        });
      }
    } catch (error) {
      addNotification({
        context: { channel },
        emitter: ChannelListItemActionButtons.name,
        error: error instanceof Error ? error : new Error('An unknown error occurred'),
        message: t('Failed to update channel pinned status'),
        severity: 'error',
        type: 'api:channel:pin:failed',
      });
    }
  };

  return {
    'aria-pressed': !!membership.pinned_at,
    title: membership.pinned_at ? t('Unpin') : t('Pin'),
    toggle,
  };
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
      const behaviorProps = useDropdownActionButtonProps(useArchiveAction());
      const { icons: { IconArchive = DefaultIconArchive } = {} } = useComponentContext();

      return (
        <ContextMenuButton
          aria-label={behaviorProps.title}
          data-testid='dropdown-action-archive'
          Icon={IconArchive}
          {...behaviorProps}
        >
          {behaviorProps.title}
        </ContextMenuButton>
      );
    },
    Ban() {
      const behaviorProps = useDropdownActionButtonProps(useBanAction());
      const { icons: { IconNoSign = DefaultIconNoSign } = {} } = useComponentContext();

      return (
        <ContextMenuButton
          aria-label={behaviorProps.title}
          data-testid='dropdown-action-ban'
          Icon={IconNoSign}
          {...behaviorProps}
        >
          {behaviorProps.title}
        </ContextMenuButton>
      );
    },
    Leave() {
      const behaviorProps = useDropdownActionButtonProps(useLeaveAction());
      const { icons: { IconLeave = DefaultIconLeave } = {} } = useComponentContext();

      return (
        <ContextMenuButton
          aria-label={behaviorProps.title}
          data-testid='dropdown-action-leave'
          Icon={IconLeave}
          variant='destructive'
          {...behaviorProps}
        >
          {behaviorProps.title}
        </ContextMenuButton>
      );
    },
    Mute() {
      const behaviorProps = useDropdownActionButtonProps(useMuteAction());
      const { icons: { IconMute = DefaultIconMute } = {} } = useComponentContext();

      return (
        <ContextMenuButton
          aria-label={behaviorProps.title}
          data-testid='dropdown-action-mute'
          Icon={IconMute}
          {...behaviorProps}
        >
          {behaviorProps.title}
        </ContextMenuButton>
      );
    },
    Pin() {
      const behaviorProps = useDropdownActionButtonProps(usePinAction());
      const { icons: { IconPin = DefaultIconPin } = {} } = useComponentContext();

      return (
        <ContextMenuButton
          aria-label={behaviorProps.title}
          data-testid='dropdown-action-pin'
          Icon={IconPin}
          {...behaviorProps}
        >
          {behaviorProps.title}
        </ContextMenuButton>
      );
    },
  },
  quick: {
    Archive() {
      const behaviorProps = useQuickActionButtonProps(useArchiveAction());
      const { icons: { IconArchive = DefaultIconArchive } = {} } = useComponentContext();

      return (
        <Button
          appearance='ghost'
          aria-label={behaviorProps.title}
          circular
          data-testid='quick-action-archive'
          size='sm'
          variant='secondary'
          {...behaviorProps}
        >
          <IconArchive />
        </Button>
      );
    },
    Mute() {
      const behaviorProps = useQuickActionButtonProps(useMuteAction());
      const { icons: { IconMute = DefaultIconMute } = {} } = useComponentContext();

      return (
        <Button
          appearance='ghost'
          aria-label={behaviorProps.title}
          circular
          data-testid='quick-action-mute'
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
    const { t } = useTranslationContext();
    const { icons: { IconMore = DefaultIconMore } = {} } = useComponentContext();

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
        aria-label={t('aria/Open Channel Actions Menu')}
        aria-pressed={dialogIsOpen}
        circular
        data-testid='channel-list-item-dropdown-toggle'
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
  const isDirectMessageChannel = connectedUserIsMember && memberCount === 2;

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
