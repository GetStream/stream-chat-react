import React, { type ComponentProps, type ComponentType, type ReactNode } from 'react';

import { Button } from '../Button';
import { IconDotGrid1x3Horizontal } from '../Icons';

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
  getDialogId: (channelId: string) => string;
  displayName: string;
}

export const ChannelListItemActionButtons: ChannelListItemActionButtonsInterface = () => {
  const { channel } = useChannelListItemContext();
  const [referenceElement, setReferenceElement] =
    React.useState<HTMLButtonElement | null>(null);
  const dialogId = ChannelListItemActionButtons.getDialogId(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    channel.id!,
  );
  const { dialog, dialogManager } = useDialogOnNearestManager({ id: dialogId });
  const dialogIsOpen = useDialogIsOpen(dialogId, dialogManager?.id);

  const filteredActionSet = useBaseChannelActionSetFilter(defaultChannelActionSet);
  const splitActionSet = useSplitActionSet(filteredActionSet);

  if (
    splitActionSet.quickActionSet.length + splitActionSet.dropdownActionSet.length ===
    0
  ) {
    // no buttons to render, omit rendering wrapper
    return null;
  }

  return (
    <div
      className={clsx('str-chat__channel-preview__action-buttons', {
        'str-chat__channel-preview__action-buttons--active': dialogIsOpen,
      })}
    >
      {splitActionSet.dropdownActionSet.length > 0 && (
        <Button
          appearance='ghost'
          aria-expanded={dialogIsOpen}
          aria-pressed={dialogIsOpen}
          circular
          onClick={(e) => {
            e.stopPropagation();

            dialog.toggle();
          }}
          ref={setReferenceElement}
          size='sm'
          variant='secondary'
        >
          <IconDotGrid1x3Horizontal />
        </Button>
      )}
      {splitActionSet.quickActionSet.map(({ Component, type }) => (
        <Component key={type} />
      ))}
      <ContextMenu
        className='str-chat__channel-preview__action-buttons-context-menu'
        dialogManagerId={dialogManager?.id}
        id={dialog.id}
        onClose={dialog?.close}
        placement='bottom-start'
        referenceElement={referenceElement}
        tabIndex={-1}
        trapFocus
      >
        {splitActionSet.dropdownActionSet.map(({ Component, type }) => (
          <Component key={type} />
        ))}
      </ContextMenu>
    </div>
  );
};

ChannelListItemActionButtons.getDialogId = (channelId: string) =>
  `channel-action-buttons-${channelId}`;

ChannelListItemActionButtons.displayName = 'ChannelListItemActionButtons';
