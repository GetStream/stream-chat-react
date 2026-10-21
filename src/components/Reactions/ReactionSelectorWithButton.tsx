import type { ComponentRef } from 'react';
import React, { useRef } from 'react';
import { ReactionSelector as DefaultReactionSelector } from './ReactionSelector';
import { DialogAnchor, useDialogIsOpen, useDialogOnNearestManager } from '../Dialog';
import {
  useComponentContext,
  useComponentContextIcons,
  useMessageContext,
  useTranslationContext,
} from '../../context';

import type { IconProps } from '../../types/types';
import { QuickMessageActionsButton } from '../MessageActions';

type ReactionSelectorWithButtonProps = {
  /** Icon of the button that opens the selector. Defaults to the `icons.IconEmoji` slot. */
  ReactionIcon?: React.ComponentType<IconProps>;
};

/** Button that toggles the reaction selector dialog, with its anchor. Not a package export. */
export const ReactionSelectorWithButton = ({
  ReactionIcon,
}: ReactionSelectorWithButtonProps) => {
  const { t } = useTranslationContext();
  const { isMyMessage, message, threadList } = useMessageContext();
  const { ReactionSelector = DefaultReactionSelector } = useComponentContext();
  const { IconEmoji } = useComponentContextIcons();
  // The prop wins: it targets one message's button, while the icon slot applies to all of them.
  const ResolvedReactionIcon = ReactionIcon ?? IconEmoji;
  const buttonRef = useRef<ComponentRef<'button'>>(null);
  // Must equal the ID `MessageActions` derives from `ReactionSelector.getDialogId`: it keeps
  // `.str-chat__message-options--active` applied while the dialog is open. A mismatch hides the
  // button when focus moves into the portal, collapsing the popover's reference element.
  const dialogId = DefaultReactionSelector.getDialogId({
    messageId: message.id,
    threadList,
  });
  const { dialog, dialogManager } = useDialogOnNearestManager({ id: dialogId });
  const dialogIsOpen = useDialogIsOpen(dialogId, dialogManager?.id);

  return (
    <>
      <DialogAnchor
        dialogManagerId={dialogManager?.id}
        id={dialogId}
        offset={8}
        placement={isMyMessage() ? 'top-end' : 'top-start'}
        referenceElement={buttonRef.current}
        trapFocus
        updatePositionOnContentResize
      >
        <ReactionSelector />
      </DialogAnchor>
      <QuickMessageActionsButton
        aria-expanded={dialogIsOpen}
        aria-label={t('common.openReactionSelector.ariaLabel', 'Open Reaction Selector')}
        className='str-chat__message-reactions-button'
        data-testid='message-reaction-action'
        onClick={() => dialog?.toggle()}
        ref={buttonRef}
      >
        <ResolvedReactionIcon className='str-chat__message-action-icon' />
      </QuickMessageActionsButton>
    </>
  );
};
