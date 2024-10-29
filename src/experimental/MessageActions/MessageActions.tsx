/* eslint-disable sort-keys */
import clsx from 'clsx';
import React, { PropsWithChildren, useState } from 'react';

import { useChatContext, useMessageContext, useTranslationContext } from '../../context';
import { ActionsIcon } from '../../components/Message/icons';
import { DialogAnchor, useDialog, useDialogIsOpen } from '../../components/Dialog';
import { MessageActionsWrapper } from '../../components/MessageActions/MessageActions';
import { MESSAGE_ACTIONS } from '../../components';

import { useBaseMessageActionSetFilter, useSplitMessageActionSet } from './hooks';
import { defaultMessageActionSet } from './defaults';

export type MessageActionSetItem = {
  Component: React.ComponentType;
  placement: 'quick' | 'dropdown';
  type:
    | keyof typeof MESSAGE_ACTIONS
    // eslint-disable-next-line @typescript-eslint/ban-types
    | (string & {});
};

export type MessageActionsProps = {
  disableBaseMessageActionSetFilter?: boolean;
  messageActionSet?: MessageActionSetItem[];
};

// TODO: allow passing down customWrapperClass
/**
 * A new actions component to replace current `MessageOptions` component.
 * Exports from `stream-chat-react/experimental` __MIGHT__ change - use with caution
 * and follow release notes in case you notice unexpected behavior.
 */
export const MessageActions = ({
  disableBaseMessageActionSetFilter = false,
  messageActionSet = defaultMessageActionSet,
}: MessageActionsProps) => {
  const { theme } = useChatContext();
  const { isMyMessage, message } = useMessageContext();
  const { t } = useTranslationContext();
  const [actionsBoxButtonElement, setActionsBoxButtonElement] = useState<HTMLButtonElement | null>(
    null,
  );

  const filteredMessageActionSet = useBaseMessageActionSetFilter(
    messageActionSet,
    disableBaseMessageActionSetFilter,
  );

  const { dropdownActionSet, quickActionSet } = useSplitMessageActionSet(filteredMessageActionSet);

  const dropdownDialogId = `message-actions--${message.id}`;
  const reactionSelectorDialogId = `reaction-selector--${message.id}`;
  const dialog = useDialog({ id: dropdownDialogId });
  const dropdownDialogIsOpen = useDialogIsOpen(dropdownDialogId);
  const reactionSelectorDialogIsOpen = useDialogIsOpen(reactionSelectorDialogId);

  // do not render anything if total action count is zero
  if (dropdownActionSet.length + quickActionSet.length === 0) {
    return null;
  }

  return (
    <div
      className={clsx(`str-chat__message-${theme}__actions str-chat__message-options`, {
        'str-chat__message-options--active': dropdownDialogIsOpen || reactionSelectorDialogIsOpen,
      })}
    >
      {dropdownActionSet.length > 0 && (
        <MessageActionsWrapper inline={false} toggleOpen={dialog?.toggle}>
          <button
            aria-expanded={dropdownDialogIsOpen}
            aria-haspopup='true'
            aria-label={t('aria/Open Message Actions Menu')}
            className='str-chat__message-actions-box-button'
            data-testid='message-actions-toggle-button'
            ref={setActionsBoxButtonElement}
          >
            <ActionsIcon className='str-chat__message-action-icon' />
          </button>

          <DialogAnchor
            id={dropdownDialogId}
            placement={isMyMessage() ? 'top-end' : 'top-start'}
            referenceElement={actionsBoxButtonElement}
            trapFocus
          >
            <DropdownBox open={dropdownDialogIsOpen}>
              {dropdownActionSet.map(({ Component: DropdownActionComponent, type }) => (
                <DropdownActionComponent key={type} />
              ))}
            </DropdownBox>
          </DialogAnchor>
        </MessageActionsWrapper>
      )}
      {quickActionSet.map(({ Component: QuickActionComponent, type }) => (
        <QuickActionComponent key={type} />
      ))}
    </div>
  );
};

const DropdownBox = ({ children, open }: PropsWithChildren<{ open: boolean }>) => {
  const { t } = useTranslationContext();
  return (
    <div
      className={clsx('str-chat__message-actions-box', {
        'str-chat__message-actions-box--open': open,
      })}
    >
      <div
        aria-label={t('aria/Message Options')}
        className='str-chat__message-actions-list'
        role='listbox'
      >
        {children}
      </div>
    </div>
  );
};
