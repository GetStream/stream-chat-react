import React, { type ComponentProps, type ComponentType, type ReactNode } from 'react';

import clsx from 'clsx';
import { ContextMenu, useDialogIsOpen, useDialogOnNearestManager } from '../Dialog';
import {
  defaultChannelActionSet,
  useBaseChannelActionSetFilter,
} from './ChannelListItemActionButtons.defaults';
import { useSplitActionSet } from '../Chat/hooks/useSplitActionSet';
import { useChannelListItemContext } from './ChannelListItem';

export type ChannelListItemActionButtonsProps = ComponentProps<ComponentType>; // hack to allow empty props

interface ChannelListItemActionButtonsInterface {
  (props: ChannelListItemActionButtonsProps): ReactNode;
  getDialogId: (_: { channelId: string }) => string;
  displayName: string;
}

export const ChannelListItemActionButtons: ChannelListItemActionButtonsInterface = () => {
  const { channel } = useChannelListItemContext();
  const [referenceElement, setReferenceElement] =
    React.useState<HTMLButtonElement | null>(null);
  const dialogId = ChannelListItemActionButtons.getDialogId({
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    channelId: channel.id!,
  });
  const { dialog, dialogManager } = useDialogOnNearestManager({ id: dialogId });
  const dialogIsOpen = useDialogIsOpen(dialogId, dialogManager?.id);

  const filteredActionSet = useBaseChannelActionSetFilter(defaultChannelActionSet);
  const { dropdownActionSet, quickActionSet, quickDropdownToggleAction } =
    useSplitActionSet(filteredActionSet);

  if (quickActionSet.length + dropdownActionSet.length === 0) {
    // no buttons to render, omit rendering wrapper
    return null;
  }

  return (
    <div
      className={clsx('str-chat__channel-list-item__action-buttons', {
        'str-chat__channel-list-item__action-buttons--active': dialogIsOpen,
      })}
    >
      {quickDropdownToggleAction && dropdownActionSet.length > 0 && (
        <quickDropdownToggleAction.Component ref={setReferenceElement} />
      )}
      {quickActionSet.map(({ Component, type }) => (
        <Component key={type} />
      ))}
      <ContextMenu
        className='str-chat__channel-list-item__action-buttons-context-menu'
        dialogManagerId={dialogManager?.id}
        id={dialog.id}
        onClose={dialog?.close}
        placement='bottom-start'
        referenceElement={referenceElement}
        tabIndex={-1}
        trapFocus
      >
        {dropdownActionSet.map(({ Component, type }) => (
          <Component key={type} />
        ))}
      </ContextMenu>
    </div>
  );
};

ChannelListItemActionButtons.getDialogId = ({ channelId }) =>
  `channel-action-buttons-${channelId}`;

ChannelListItemActionButtons.displayName = 'ChannelListItemActionButtons';
