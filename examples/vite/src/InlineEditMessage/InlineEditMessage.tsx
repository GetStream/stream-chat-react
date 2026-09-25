import { type ComponentProps, useCallback, useEffect, useMemo, useState } from 'react';
import { MessageComposer as MessageComposerController } from 'stream-chat';
import type { LocalMessage, MessageComposerState } from 'stream-chat';
import {
  asDynamicKey,
  ContextMenuButton,
  defaultMessageActionSet,
  MessageUI as DefaultMessageUI,
  IconEdit,
  MessageActions,
  type MessageActionSetItem,
  MessageComposer,
  MessageComposerControllerProvider,
  type MessageUIComponentProps,
  useChatContext,
  useComponentContext,
  useContextMenuContext,
  useMessageContext,
  useStateStore,
  useThreadContext,
  useTranslationContext,
  WithComponents,
} from 'stream-chat-react';

import { useAppSettingsSelector } from '../AppSettings';
import type { MessageActionSurface } from '../AppSettings';

// Next to the built-in edit, so the two ways of editing read as alternatives.
const insertBeforeEdit = (
  actionSet: MessageActionSetItem[],
  actionSetItem: MessageActionSetItem,
) => {
  const editIndex = actionSet.findIndex((item) => 'type' in item && item.type === 'edit');

  if (editIndex < 0) return [...actionSet, actionSetItem];

  return [...actionSet.slice(0, editIndex), actionSetItem, ...actionSet.slice(editIndex)];
};

const editingSelector = (state: MessageComposerState) => ({
  editing: state.editedMessage != null,
});

/**
 * Swaps a message for a `MessageComposer` in place, editing it through a composer of its own
 * supplied with `MessageComposerControllerProvider` - so the channel's own composer, and whatever
 * the user was typing into it, are left alone. That composer is kept in the client's composer cache
 * under the message's tag, so an unfinished edit outlives this row.
 */
export const InlineEditableMessage = (props: MessageUIComponentProps) => {
  const { client } = useChatContext();
  const { message } = useMessageContext();
  const surface: MessageActionSurface = useThreadContext() ? 'thread' : 'channel';
  const { customMessageActions } = useAppSettingsSelector(
    (state) => state.messageActions,
  );
  const inlineEditEnabled = customMessageActions[surface].inlineEdit;
  const { MessageActions: OuterMessageActions = MessageActions } = useComponentContext();

  // Only looks - a row nobody edits creates nothing. A composer found here holding an edit is one
  // left unfinished while this row was unmounted, so the editor comes straight back.
  const [editingComposer, setEditingComposer] = useState(() =>
    client.messageComposerCache.peek(MessageComposerController.constructTag(message)),
  );

  const { editing } = useStateStore(editingComposer?.state, editingSelector) ?? {
    editing: false,
  };

  // Entering edit mode is where the composer is created if missing, and stored at once.
  const startEditing = useCallback(
    (messageToEdit: LocalMessage) => {
      const tag = MessageComposerController.constructTag(messageToEdit);
      const composer =
        client.messageComposerCache.peek(tag) ??
        // Drafts off: an edit is not a draft.
        new MessageComposerController({
          client,
          compositionContext: messageToEdit,
          config: { drafts: { enabled: false } },
        });
      client.messageComposerCache.add(tag, composer);
      composer.initState({ composition: messageToEdit });
      setEditingComposer(composer);
    },
    [client],
  );

  // Turning the setting off mid-edit abandons the edit, rather than leaving the message stuck as a
  // composer with no way back.
  useEffect(() => {
    if (!inlineEditEnabled && editing) editingComposer?.clear();
  }, [editing, editingComposer, inlineEditEnabled]);

  const MessageActionsWithInlineEdit = useMemo(() => {
    const InlineEditAction = () => {
      const { closeMenu } = useContextMenuContext();
      const { message } = useMessageContext();
      const { t } = useTranslationContext();

      return (
        <ContextMenuButton
          aria-label={t(
            asDynamicKey('viteExample.inlineEdit.action.ariaLabel'),
            'Edit message inline',
          )}
          className='str-chat__message-actions-list-item-button'
          Icon={IconEdit}
          onClick={() => {
            startEditing(message);
            closeMenu();
          }}
        >
          {t(asDynamicKey('viteExample.inlineEdit.action.label'), 'Edit inline')}
        </ContextMenuButton>
      );
    };

    const inlineEditActionSetItem: MessageActionSetItem = {
      Component: InlineEditAction,
      placement: 'dropdown',
      type: 'editInline',
    };

    const Component = (actionsProps: ComponentProps<typeof MessageActions>) => {
      const messageActionSet = useMemo(
        () =>
          insertBeforeEdit(
            actionsProps.messageActionSet ?? defaultMessageActionSet,
            inlineEditActionSetItem,
          ),
        [actionsProps.messageActionSet],
      );

      return (
        <OuterMessageActions {...actionsProps} messageActionSet={messageActionSet} />
      );
    };
    Component.displayName = 'MessageActionsWithInlineEdit';
    return Component;
  }, [OuterMessageActions, startEditing]);

  if (!inlineEditEnabled) return <DefaultMessageUI {...props} />;

  if (editing && editingComposer) {
    return (
      <MessageComposerControllerProvider messageComposerController={editingComposer}>
        <div className='app__inline-edit-message'>
          {/* The composer outlives this editor: leaving the channel, or scrolling the row away in a
              virtualized message list, unmounts the editor, and `MessageComposer` never clears a
              supplied composer on unmount - so the unfinished edit is still there on return.
              Cancelling is the ✕ on the edit preview, which clears it on purpose. */}
          <MessageComposer />
        </div>
      </MessageComposerControllerProvider>
    );
  }

  return (
    <WithComponents overrides={{ MessageActions: MessageActionsWithInlineEdit }}>
      <DefaultMessageUI {...props} />
    </WithComponents>
  );
};
