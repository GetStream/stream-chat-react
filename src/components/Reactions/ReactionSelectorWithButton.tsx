import type { ElementRef } from 'react';
import React, { useRef } from 'react';
import { ReactionSelector as DefaultReactionSelector } from './ReactionSelector';
import { DialogAnchor, useDialogIsOpen, useDialogOnNearestManager } from '../Dialog';
import {
  useComponentContext,
  useMessageContext,
  useTranslationContext,
} from '../../context';

import type { IconProps } from '../../types/types';
import { QuickMessageActionsButton } from '../MessageActions';

type ReactionSelectorWithButtonProps = {
  /* Custom component rendering the icon used in a button invoking reactions selector for a given message. */
  ReactionIcon: React.ComponentType<IconProps>;
};

/**
 * Internal convenience component - not to be exported. It just groups the button and the dialog anchor and thus prevents
 * cluttering the parent component.
 */
export const ReactionSelectorWithButton = ({
  ReactionIcon,
}: ReactionSelectorWithButtonProps) => {
  const { t } = useTranslationContext('ReactionSelectorWithButton');
  const { isMyMessage, message, threadList } = useMessageContext('MessageOptions');
  const { ReactionSelector = DefaultReactionSelector } =
    useComponentContext('MessageOptions');
  const buttonRef = useRef<ElementRef<'button'>>(null);
  const dialogIdNamespace = threadList ? '-thread-' : '';
  const dialogId = `reaction-selector${dialogIdNamespace}--${message.id}`;
  const { dialog, dialogManager } = useDialogOnNearestManager({ id: dialogId });
  const dialogIsOpen = useDialogIsOpen(dialogId, dialogManager?.id);

  return (
    <>
      <DialogAnchor
        dialogManagerId={dialogManager?.id}
        id={dialogId}
        placement={isMyMessage() ? 'top-end' : 'top-start'}
        referenceElement={buttonRef.current}
        trapFocus
        updatePositionOnContentResize
      >
        <ReactionSelector />
      </DialogAnchor>
      <QuickMessageActionsButton
        aria-expanded={dialogIsOpen}
        aria-label={t('aria/Open Reaction Selector')}
        className='str-chat__message-reactions-button'
        data-testid='message-reaction-action'
        onClick={() => dialog?.toggle()}
        ref={buttonRef}
      >
        <ReactionIcon className='str-chat__message-action-icon' />
      </QuickMessageActionsButton>
    </>
  );
};
