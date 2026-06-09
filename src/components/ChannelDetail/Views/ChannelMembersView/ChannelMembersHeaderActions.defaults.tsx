import React, { useMemo, useState } from 'react';

import {
  modalDialogManagerId,
  useComponentContext,
  useModalContext,
  useTranslationContext,
} from '../../../../context';
import { Button } from '../../../Button';
import {
  ContextMenu,
  ContextMenuButton,
  useDialog,
  useDialogIsOpen,
} from '../../../Dialog';
import { useChannelDetailContext } from '../../ChannelDetailContext';
import { canUpdateChannelMembers } from './ChannelMembersView.utils';
import type {
  ChannelMembersHeaderActionsProps,
  ChannelMembersViewController,
} from './ChannelMembersView';

export type ChannelMembersHeaderActionType =
  | 'addMembers'
  | 'manageMembers'
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
          case 'manageMembers':
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
      onClick={() => {
        controller.setMode('add');
        closeMenu?.();
      }}
    >
      {t('Add')}
    </ContextMenuButton>
  );
};

const ManageMembersHeaderAction = ({
  controller,
}: ChannelMembersHeaderActionComponentProps) => {
  const { t } = useTranslationContext();

  if (controller.mode !== 'browse') return null;

  return (
    <Button
      appearance='outline'
      aria-label={t('Manage channel members')}
      className='str-chat__channel-detail__channel-members-view__manage-button'
      onClick={() => controller.setMode('manage')}
      size='md'
      variant='secondary'
    >
      {t('Manage')}
    </Button>
  );
};

const ManageMembersMenuAction = ({
  closeMenu,
  controller,
}: ChannelMembersHeaderActionComponentProps) => {
  const { t } = useTranslationContext();

  if (controller.mode !== 'browse') return null;

  return (
    <ContextMenuButton
      aria-label={t('Manage channel members')}
      onClick={() => {
        controller.setMode('manage');
        closeMenu?.();
      }}
    >
      {t('Manage')}
    </ContextMenuButton>
  );
};

export const DefaultChannelMembersHeaderActions = {
  AddMembers: AddMembersHeaderAction,
  AddMembersMenu: AddMembersMenuAction,
  ManageMembers: ManageMembersHeaderAction,
  ManageMembersMenu: ManageMembersMenuAction,
};

export const defaultChannelMembersHeaderActionSet: ChannelMembersHeaderActionItem[] = [
  {
    menu: DefaultChannelMembersHeaderActions.AddMembers,
    type: 'addMembers',
  },
  {
    quick: DefaultChannelMembersHeaderActions.ManageMembers,
    type: 'manageMembers',
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
  const modalContext = useModalContext();
  const dialogManagerId = modalContext?.dialogId ? modalDialogManagerId : undefined;
  const dialog = useDialog({ dialogManagerId, id: dialogId });
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
