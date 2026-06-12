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
  ChannelMembersViewController,
} from './ChannelMembersView';
import { IconUserAdd, IconUserRemove } from '../../../../components/Icons';

export type ChannelMembersHeaderActionType =
  | 'addMembers'
  | 'removeMembers'
  | (string & {});

export type ChannelMembersHeaderActionComponentProps = {
  closeMenu?: () => void;
  controller: ChannelMembersViewController;
};

export type ChannelMembersHeaderActionItem = {
  type: ChannelMembersHeaderActionType;
  quick?: React.ComponentType<ChannelMembersHeaderActionComponentProps>;
  menu?: React.ComponentType<ChannelMembersHeaderActionComponentProps>;
};

const useChannelMembersHeaderActionFilterState = () => {
  const { channel } = useChannelDetailContext();

  return {
    canManageChannelMembers: canUpdateChannelMembers(channel),
  };
};

export const useBaseChannelMembersHeaderActionSetFilter = (
  channelMembersHeaderActionSet: ChannelMembersHeaderActionItem[],
) => {
  const { canManageChannelMembers } = useChannelMembersHeaderActionFilterState();

  return useMemo(
    () =>
      channelMembersHeaderActionSet.filter((action) => {
        switch (action.type) {
          case 'addMembers':
          case 'removeMembers':
            return canManageChannelMembers;
          default:
            return true;
        }
      }),
    [canManageChannelMembers, channelMembersHeaderActionSet],
  );
};

const AddMembersHeaderAction = ({
  controller,
}: ChannelMembersHeaderActionComponentProps) => {
  const { t } = useTranslationContext();

  if (controller.mode !== 'browse') return null;

  return (
    <Button
      appearance='outline'
      aria-label={t('Add channel members')}
      className='str-chat__channel-detail__channel-members-view__add-button'
      onClick={() => controller.setMode('add')}
      size='md'
      variant='secondary'
    >
      {t('Add')}
    </Button>
  );
};

const AddMembersMenuAction = ({
  closeMenu,
  controller,
}: ChannelMembersHeaderActionComponentProps) => {
  const { t } = useTranslationContext();

  if (controller.mode !== 'browse') return null;

  return (
    <ContextMenuButton
      aria-label={t('Add channel members')}
      Icon={IconUserAdd}
      onClick={() => {
        controller.setMode('add');
        closeMenu?.();
      }}
    >
      {t('Add')}
    </ContextMenuButton>
  );
};

const RemoveMembersHeaderAction = ({
  controller,
}: ChannelMembersHeaderActionComponentProps) => {
  const { t } = useTranslationContext();

  if (controller.mode !== 'browse') return null;

  return (
    <Button
      appearance='outline'
      aria-label={t('Remove channel members')}
      className='str-chat__channel-detail__channel-members-view__remove-button'
      onClick={() => controller.setMode('remove')}
      size='md'
      variant='secondary'
    >
      {t('Remove')}
    </Button>
  );
};

const RemoveMembersMenuAction = ({
  closeMenu,
  controller,
}: ChannelMembersHeaderActionComponentProps) => {
  const { t } = useTranslationContext();

  if (controller.mode !== 'browse') return null;

  return (
    <ContextMenuButton
      aria-label={t('Remove channel members')}
      Icon={IconUserRemove}
      onClick={() => {
        controller.setMode('remove');
        closeMenu?.();
      }}
    >
      {t('Remove')}
    </ContextMenuButton>
  );
};

export const DefaultChannelMembersHeaderActions = {
  AddMembers: AddMembersHeaderAction,
  AddMembersMenu: AddMembersMenuAction,
  RemoveMembers: RemoveMembersHeaderAction,
  RemoveMembersMenu: RemoveMembersMenuAction,
};

export const defaultChannelMembersHeaderActionSet: ChannelMembersHeaderActionItem[] = [
  {
    quick: DefaultChannelMembersHeaderActions.AddMembers,
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
  controller,
  headerActionSet,
  HeaderActionsMenuTrigger = DefaultHeaderActionsMenuTrigger,
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

  const quickActions = actions.filter((action) => !!action.quick);
  const menuActions = actions.filter((action) => !!action.menu);
  const shouldRenderSingleQuickAction = actions.length === 1 && quickActions.length === 1;
  const shouldRenderMenu =
    (actions.length === 1 && !shouldRenderSingleQuickAction && menuActions.length > 0) ||
    (actions.length > 1 && menuActions.length > 0);
  const quickActionsOutsideMenu = shouldRenderSingleQuickAction
    ? []
    : shouldRenderMenu
      ? quickActions.filter((action) => !action.menu)
      : quickActions;

  return (
    <div className='str-chat__channel-detail__channel-members-view__header-actions'>
      {shouldRenderSingleQuickAction &&
        quickActions.map(({ quick: QuickComponent, type }) =>
          QuickComponent ? <QuickComponent controller={controller} key={type} /> : null,
        )}

      {quickActionsOutsideMenu.map(({ quick: QuickComponent, type }) =>
        QuickComponent ? <QuickComponent controller={controller} key={type} /> : null,
      )}

      {shouldRenderMenu && (
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
            {menuActions.map(({ menu: MenuComponent, type }) =>
              MenuComponent ? (
                <MenuComponent
                  closeMenu={() => dialog.close()}
                  controller={controller}
                  key={type}
                />
              ) : null,
            )}
          </ContextMenuComponent>
        </>
      )}
    </div>
  );
};
