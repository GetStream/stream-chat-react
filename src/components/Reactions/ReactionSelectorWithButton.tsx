import React, { ElementRef, useRef } from 'react';
import { ReactionSelector as DefaultReactionSelector } from './ReactionSelector';
import { DialogAnchor, useDialog, useDialogIsOpen } from '../Dialog';
import { useComponentContext, useMessageContext, useTranslationContext } from '../../context';
import type { DefaultStreamChatGenerics } from '../../types';
import type { IconProps } from '../../types/types';

type ReactionSelectorWithButtonProps = {
  /* Custom component rendering the icon used in a button invoking reactions selector for a given message. */
  ReactionIcon: React.ComponentType<IconProps>;
  /* Theme string to be added to CSS class names. */
  theme: string;
};

/**
 * Internal convenience component - not to be exported. It just groups the button and the dialog anchor and thus prevents
 * cluttering the parent component.
 */
export const ReactionSelectorWithButton = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  ReactionIcon,
  theme,
}: ReactionSelectorWithButtonProps) => {
  const { t } = useTranslationContext('ReactionSelectorWithButton');
  const { isMyMessage, message } = useMessageContext<StreamChatGenerics>('MessageOptions');
  const { ReactionSelector = DefaultReactionSelector } = useComponentContext('MessageOptions');
  const buttonRef = useRef<ElementRef<'button'>>(null);
  const dialogId = `reaction-selector--${message.id}`;
  const dialog = useDialog({ id: dialogId });
  const dialogIsOpen = useDialogIsOpen(dialogId);
  return (
    <>
      <DialogAnchor
        id={dialogId}
        placement={isMyMessage() ? 'top-end' : 'top-start'}
        referenceElement={buttonRef.current}
        trapFocus
      >
        <ReactionSelector />
      </DialogAnchor>
      <button
        aria-expanded={dialogIsOpen}
        aria-label={t('aria/Open Reaction Selector')}
        className={`str-chat__message-${theme}__actions__action str-chat__message-${theme}__actions__action--reactions str-chat__message-reactions-button`}
        data-testid='message-reaction-action'
        onClick={() => dialog?.toggle()}
        ref={buttonRef}
      >
        <ReactionIcon className='str-chat__message-action-icon' />
      </button>
    </>
  );
};
