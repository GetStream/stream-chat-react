import type { Channel } from 'stream-chat';
import React, {
  type ComponentPropsWithoutRef,
  forwardRef,
  useMemo,
  useState,
} from 'react';

import {
  useComponentContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../../../context';
import { Button } from '../../../../components/Button';
import { useSplitActionSet } from '../../../../components/Chat/hooks/useSplitActionSet';
import {
  ContextMenu,
  ContextMenuButton,
  useContextMenuContext,
  useDialogIsOpen,
  useDialogOnNearestManager,
} from '../../../../components/Dialog';
import { useStableId } from '../../../../components/UtilityComponents/useStableId';
import { useChannelDetailContext } from '../../ChannelDetailContext';
import { canUpdateChannelMembers } from './ChannelMembersView.utils';
import type {
  ChannelMembersHeaderActionsProps,
  ChannelMembersModeController,
} from './ChannelMembersView';

export type ChannelMembersHeaderActionType = 'addMembers' | (string & {});

export type ChannelMembersHeaderActionComponentProps = {
  modeController: ChannelMembersModeController;
};

/** What a header action's `isVisible` rule is checked against. */
export type ChannelMembersHeaderActionVisibilityFilterParams = {
  /** The channel whose members are shown, e.g. to read `channel.data.own_capabilities`. */
  channel: Channel;
};

type BaseChannelMembersHeaderActionItem = {
  Component: React.ComponentType<ChannelMembersHeaderActionComponentProps>;
  /**
   * Hides the action for a channel, e.g. an app-defined action the user lacks the capability for.
   * Cannot show an action the base filter removes (`addMembers` without `update-channel-members`).
   * Shown when omitted.
   */
  isVisible?: (state: ChannelMembersHeaderActionVisibilityFilterParams) => boolean;
  type: ChannelMembersHeaderActionType;
};

/** Rendered inline in the members header. */
export type QuickChannelMembersHeaderActionItem = BaseChannelMembersHeaderActionItem & {
  placement: 'quick';
};

/**
 * Rendered inside the actions dropdown menu, so the component can close the menu with `closeMenu`
 * from `useContextMenuContext()`.
 */
export type DropdownChannelMembersHeaderActionItem =
  BaseChannelMembersHeaderActionItem & {
    placement: 'dropdown';
  };

/**
 * The button that opens the actions dropdown menu. Rendered only while at least one `dropdown` item
 * passes the filter. It receives the ref the menu anchors to, `aria-expanded` and the `onClick`
 * that toggles the menu; a custom toggle is a `forwardRef` component (so the ref reaches its button
 * on every supported React version) that spreads the props onto its button. A toggle that ignores
 * the props never opens the menu.
 */
export type QuickDropdownToggleChannelMembersHeaderActionItem = {
  Component: React.ForwardRefExoticComponent<
    ComponentPropsWithoutRef<'button'> & React.RefAttributes<HTMLButtonElement>
  >;
  placement: 'quick-dropdown-toggle';
};

export type ChannelMembersHeaderActionItem =
  | QuickChannelMembersHeaderActionItem
  | DropdownChannelMembersHeaderActionItem
  | QuickDropdownToggleChannelMembersHeaderActionItem;

/**
 * Where a header action renders: inline (`quick`), inside the actions dropdown menu (`dropdown`),
 * or as the button that opens that menu (`quick-dropdown-toggle`).
 */
export type ChannelMembersHeaderActionPlacement =
  ChannelMembersHeaderActionItem['placement'];

/**
 * Drops header actions the user cannot use: `addMembers` requires `update-channel-members`. An
 * action that rule allows still shows only while its own `isVisible` holds. The dropdown toggle is
 * always kept. Applied by {@link DefaultHeaderActions}.
 *
 * @param channelMembersHeaderActionSet - Actions to filter.
 * @returns The actions to show.
 */
export const useBaseChannelMembersHeaderActionSetFilter = (
  channelMembersHeaderActionSet: ChannelMembersHeaderActionItem[],
) => {
  const { channel } = useChannelDetailContext();
  const canManageChannelMembers = canUpdateChannelMembers(channel);

  return useMemo(() => {
    const visibilityFilterParams: ChannelMembersHeaderActionVisibilityFilterParams = {
      channel,
    };

    const passesBaseRule = (action: ChannelMembersHeaderActionItem) =>
      action.placement === 'quick-dropdown-toggle' ||
      action.type !== 'addMembers' ||
      canManageChannelMembers;

    const passesOwnRule = (action: ChannelMembersHeaderActionItem) =>
      action.placement === 'quick-dropdown-toggle' ||
      !action.isVisible ||
      action.isVisible(visibilityFilterParams);

    return channelMembersHeaderActionSet.filter(
      (action) => passesBaseRule(action) && passesOwnRule(action),
    );
  }, [canManageChannelMembers, channel, channelMembersHeaderActionSet]);
};

const AddMembersHeaderAction = ({
  modeController,
}: ChannelMembersHeaderActionComponentProps) => {
  const { t } = useTranslationContext();

  if (modeController.mode !== 'browse') return null;

  return (
    <Button
      appearance='outline'
      aria-label={t(
        'channelDetail.channelMembersHeader.addChannelMembers.ariaLabel',
        'Add channel members',
      )}
      className='str-chat__channel-detail__channel-members-view__add-button'
      onClick={() => modeController.setMode('add')}
      size='md'
      variant='secondary'
    >
      {t('channelDetail.channelMembersHeader.add.text', 'Add')}
    </Button>
  );
};

const AddMembersMenuAction = ({
  modeController,
}: ChannelMembersHeaderActionComponentProps) => {
  const { IconUserAdd } = useComponentContextIcons();
  const { t } = useTranslationContext();
  const { closeMenu } = useContextMenuContext();

  if (modeController.mode !== 'browse') return null;

  return (
    <ContextMenuButton
      aria-label={t(
        'channelDetail.channelMembersHeader.addChannelMembers.ariaLabel',
        'Add channel members',
      )}
      Icon={IconUserAdd}
      onClick={() => {
        modeController.setMode('add');
        closeMenu();
      }}
    >
      {t('channelDetail.channelMembersHeader.add.text', 'Add')}
    </ContextMenuButton>
  );
};

const QuickDropdownToggle = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<'button'>
>(function QuickDropdownToggle(props, ref) {
  const { t } = useTranslationContext();

  return (
    <Button
      appearance='outline'
      aria-label={t(
        'channelDetail.channelMembersHeader.openMembersActions.ariaLabel',
        'Open members actions',
      )}
      className='str-chat__channel-detail__channel-members-view__actions-button'
      ref={ref}
      size='md'
      variant='secondary'
      {...props}
    >
      {t('channelDetail.channelMembersHeader.actions.text', 'Actions')}
    </Button>
  );
});

export const DefaultChannelMembersHeaderActions = {
  AddMembers: AddMembersHeaderAction,
  AddMembersMenu: AddMembersMenuAction,
  QuickDropdownToggle,
};

export const defaultChannelMembersHeaderActionSet: ChannelMembersHeaderActionItem[] = [
  {
    Component: DefaultChannelMembersHeaderActions.QuickDropdownToggle,
    placement: 'quick-dropdown-toggle',
  },
  {
    Component: DefaultChannelMembersHeaderActions.AddMembers,
    placement: 'quick',
    type: 'addMembers',
  },
];

/**
 * Renders the `quick` actions inline, followed by the `quick-dropdown-toggle` item and the
 * `dropdown` actions in the menu it opens. Renders nothing when no quick or dropdown action passes
 * {@link useBaseChannelMembersHeaderActionSetFilter}. Each instance opens its own menu dialog, so
 * two members views under one dialog manager never open each other's menu.
 */
export const DefaultHeaderActions = ({
  headerActionSet,
  modeController,
}: ChannelMembersHeaderActionsProps) => {
  const { ContextMenu: ContextMenuComponent = ContextMenu } = useComponentContext();
  const actions = useBaseChannelMembersHeaderActionSetFilter(headerActionSet);
  const { dropdownActionSet, quickActionSet, quickDropdownToggleAction } =
    useSplitActionSet(actions);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(
    null,
  );
  const instanceId = useStableId();
  const dropdownDialogId = `channel-members-header-actions-${instanceId}`;
  const { dialog, dialogManager } = useDialogOnNearestManager({ id: dropdownDialogId });
  const dialogIsOpen = useDialogIsOpen(dropdownDialogId, dialogManager?.id);

  if (quickActionSet.length + dropdownActionSet.length === 0) return null;

  return (
    <div className='str-chat__channel-detail__channel-members-view__header-actions'>
      {quickActionSet.map(({ Component, type }) => (
        <Component key={type} modeController={modeController} />
      ))}

      {quickDropdownToggleAction && dropdownActionSet.length > 0 && (
        <>
          <quickDropdownToggleAction.Component
            aria-expanded={dialogIsOpen}
            onClick={() => dialog.toggle()}
            ref={setReferenceElement}
          />
          <ContextMenuComponent
            aria-label='Members actions'
            className='str-chat__channel-detail__channel-members-view__header-actions-menu'
            dialogManagerId={dialogManager?.id}
            id={dialog.id}
            onClose={() => dialog.close()}
            placement='bottom-start'
            referenceElement={referenceElement}
            tabIndex={-1}
            trapFocus
          >
            {dropdownActionSet.map(({ Component, type }) => (
              <Component key={type} modeController={modeController} />
            ))}
          </ContextMenuComponent>
        </>
      )}
    </div>
  );
};
