import type { Channel } from 'stream-chat';
import React, { useMemo, useState } from 'react';

import { useComponentContext, useTranslationContext } from '../../../../context';
import { Button } from '../../../../components/Button';
import {
  ContextMenu,
  ContextMenuButton,
  useDialogIsOpen,
  useDialogOnNearestManager,
} from '../../../../components/Dialog';
import { useChannelDetailContext } from '../../ChannelDetailContext';
import { canUpdateChannelMembers } from './ChannelMembersView.utils';
import type {
  ChannelMembersHeaderActionsProps,
  ChannelMembersModeController,
} from './ChannelMembersView';
import { IconUserAdd } from '../../../../components/Icons';

export type ChannelMembersHeaderActionType = 'addMembers' | (string & {});

export type ChannelMembersHeaderActionComponentProps = {
  closeMenu?: () => void;
  modeController: ChannelMembersModeController;
};

/** Where a header action renders: inline (`quick`) or inside the actions menu. */
export type ChannelMembersHeaderActionPlacement = 'quick' | 'menu';

export type ChannelMembersHeaderActionItem = {
  component: React.ComponentType<ChannelMembersHeaderActionComponentProps>;
  placement: ChannelMembersHeaderActionPlacement;
  type: ChannelMembersHeaderActionType;
  /**
   * Optional visibility gate for app-defined actions. Apps that add their own
   * actions are responsible for their permission checks here (the predicate
   * receives the `channel` so it can read `own_capabilities`). The SDK's own
   * actions are gated internally and do not rely on this.
   */
  filter?: (ctx: { channel: Channel }) => boolean;
};

/**
 * First-pass filter applied by {@link DefaultHeaderActions}. The SDK's own
 * actions are gated internally by capability — `addMembers` requires
 * `update-channel-members`; any other action is shown by default. App-defined
 * actions may further narrow visibility via their own `filter` predicate (which
 * is what an app should use to gate, e.g., a custom member-removal action).
 */
export const useBaseChannelMembersHeaderActionSetFilter = (
  channelMembersHeaderActionSet: ChannelMembersHeaderActionItem[],
) => {
  const { channel } = useChannelDetailContext();
  const canManageChannelMembers = canUpdateChannelMembers(channel);

  return useMemo(
    () =>
      channelMembersHeaderActionSet.filter((action) => {
        const allowedByCapability =
          action.type !== 'addMembers' || canManageChannelMembers;

        return allowedByCapability && (action.filter?.({ channel }) ?? true);
      }),
    [canManageChannelMembers, channel, channelMembersHeaderActionSet],
  );
};

const AddMembersHeaderAction = ({
  modeController,
}: ChannelMembersHeaderActionComponentProps) => {
  const { t } = useTranslationContext();

  if (modeController.mode !== 'browse') return null;

  return (
    <Button
      appearance='outline'
      aria-label={t('Add channel members')}
      className='str-chat__channel-detail__channel-members-view__add-button'
      onClick={() => modeController.setMode('add')}
      size='md'
      variant='secondary'
    >
      {t('Add')}
    </Button>
  );
};

const AddMembersMenuAction = ({
  closeMenu,
  modeController,
}: ChannelMembersHeaderActionComponentProps) => {
  const { t } = useTranslationContext();

  if (modeController.mode !== 'browse') return null;

  return (
    <ContextMenuButton
      aria-label={t('Add channel members')}
      Icon={IconUserAdd}
      onClick={() => {
        modeController.setMode('add');
        closeMenu?.();
      }}
    >
      {t('Add')}
    </ContextMenuButton>
  );
};

export const DefaultChannelMembersHeaderActions = {
  AddMembers: AddMembersHeaderAction,
  AddMembersMenu: AddMembersMenuAction,
};

export const defaultChannelMembersHeaderActionSet: ChannelMembersHeaderActionItem[] = [
  {
    component: DefaultChannelMembersHeaderActions.AddMembers,
    placement: 'quick',
    type: 'addMembers',
  },
];

export type ChannelMembersHeaderActionsMenuTriggerProps = {
  'aria-expanded': boolean;
  onClick: () => void;
  referenceRef?: React.Ref<HTMLButtonElement>;
};

export const DefaultHeaderActionsMenuTrigger = ({
  referenceRef,
  ...props
}: ChannelMembersHeaderActionsMenuTriggerProps) => {
  const { t } = useTranslationContext();

  return (
    <Button
      appearance='outline'
      aria-label={t('Open members actions')}
      className='str-chat__channel-detail__channel-members-view__actions-button'
      ref={referenceRef}
      size='md'
      variant='secondary'
      {...props}
    >
      {t('Actions')}
    </Button>
  );
};

const getHeaderActionsDialogId = (channelId?: string) =>
  `channel-members-header-actions-${channelId ?? 'unknown'}`;

export const DefaultHeaderActions = ({
  headerActionSet,
  HeaderActionsMenuTrigger = DefaultHeaderActionsMenuTrigger,
  modeController,
}: ChannelMembersHeaderActionsProps) => {
  const { ContextMenu: ContextMenuComponent = ContextMenu } = useComponentContext();
  const { channel } = useChannelDetailContext();
  const actions = useBaseChannelMembersHeaderActionSetFilter(headerActionSet);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(
    null,
  );
  const dialogId = getHeaderActionsDialogId(channel.id);
  const { dialog, dialogManager } = useDialogOnNearestManager({ id: dialogId });
  const dialogManagerId = dialogManager?.id;
  const dialogIsOpen = useDialogIsOpen(dialogId, dialogManagerId);

  if (!actions.length) return null;

  const quickActions = actions.filter((action) => action.placement === 'quick');
  const menuActions = actions.filter((action) => action.placement === 'menu');

  return (
    <div className='str-chat__channel-detail__channel-members-view__header-actions'>
      {quickActions.map(({ component: QuickComponent, type }) => (
        <QuickComponent key={type} modeController={modeController} />
      ))}

      {menuActions.length > 0 && (
        <>
          <HeaderActionsMenuTrigger
            aria-expanded={dialogIsOpen}
            onClick={() => {
              dialog.toggle();
            }}
            referenceRef={setReferenceElement}
          />
          <ContextMenuComponent
            aria-label='Members actions'
            className='str-chat__channel-detail__channel-members-view__header-actions-menu'
            dialogManagerId={dialogManagerId}
            id={dialog.id}
            onClose={() => dialog.close()}
            placement='bottom-start'
            referenceElement={referenceElement}
            tabIndex={-1}
            trapFocus
          >
            {menuActions.map(({ component: MenuComponent, type }) => (
              <MenuComponent
                closeMenu={() => dialog.close()}
                key={type}
                modeController={modeController}
              />
            ))}
          </ContextMenuComponent>
        </>
      )}
    </div>
  );
};
