import type { ComponentRef } from 'react';
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
import { IconEmoji as DefaultIconEmoji } from '../Icons';

type ReactionSelectorWithButtonProps = {
  /**
   * Custom component rendering the icon used in a button invoking reactions selector for a given message.
   * @deprecated Use the `icons.IconEmoji` slot on `ComponentContext` (via `<WithComponents overrides={{ icons: { IconEmoji: ... } }}>`) instead.
   * Passing this prop still wins over the context slot for backwards compatibility.
   */
  ReactionIcon?: React.ComponentType<IconProps>;
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
  const {
    icons: { IconEmoji = DefaultIconEmoji } = {},
    ReactionSelector = DefaultReactionSelector,
  } = useComponentContext();
  const ResolvedReactionIcon = ReactionIcon ?? IconEmoji;
  const buttonRef = useRef<ComponentRef<'button'>>(null);
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
        aria-label={t('aria/Open Reaction Selector')}
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
