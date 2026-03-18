import React, { type JSX } from 'react';
import type { Channel } from 'stream-chat';

import { Button } from '../Button';
import { IconDotGrid1x3Horizontal } from '../Icons';

import clsx from 'clsx';
import { ContextMenu, useDialogIsOpen, useDialogOnNearestManager } from '../Dialog';
import {
  defaultChannelActionSet,
  useBaseChannelActionSetFilter,
} from './ChannelPreviewActionButtons.defaults';
import { useSplitActionSet } from '../MessageActions';

export type ChannelPreviewActionButtonsProps = {
  channel: Channel;
};

interface ChannelPreviewActionButtonsInterface {
  (props: ChannelPreviewActionButtonsProps): JSX.Element;
  getDialogId: (channelId: string) => string;
  name: string;
}

export const ChannelPreviewActionButtons: ChannelPreviewActionButtonsInterface = ({
  channel,
}) => {
  const [referenceElement, setReferenceElement] =
    React.useState<HTMLButtonElement | null>(null);
  const dialogId = ChannelPreviewActionButtons.getDialogId(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    channel.id!,
  );
  const { dialog, dialogManager } = useDialogOnNearestManager({ id: dialogId });
  const dialogIsOpen = useDialogIsOpen(dialogId, dialogManager?.id);

  const filteredActionSet = useBaseChannelActionSetFilter(defaultChannelActionSet);
  const splitActionSet = useSplitActionSet(filteredActionSet);

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

ChannelPreviewActionButtons.getDialogId = (channelId: string) =>
  `channel-action-buttons-${channelId}`;
