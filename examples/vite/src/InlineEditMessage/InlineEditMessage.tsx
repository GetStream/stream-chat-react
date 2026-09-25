import { type ComponentProps, useEffect, useMemo, useState } from 'react';
import { MessageComposer as MessageComposerController } from 'stream-chat';
import type { MessageComposerState } from 'stream-chat';
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
  useChannel,
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
 * Swaps a message for a `MessageComposer` in place, editing it through a composer this component
 * owns and supplies with `MessageComposerControllerProvider` - so the channel's own composer, and
 * whatever the user was typing into it, are left alone.
 */
export const InlineEditableMessage = (props: MessageUIComponentProps) => {
  const { client } = useChatContext();
  const channel = useChannel();
  const surface: MessageActionSurface = useThreadContext() ? 'thread' : 'channel';
  const { customMessageActions } = useAppSettingsSelector(
    (state) => state.messageActions,
  );
  const inlineEditEnabled = customMessageActions[surface].inlineEdit;
  const { MessageActions: OuterMessageActions = MessageActions } = useComponentContext();

  // Drafts off: an edit is not a draft, and the channel's draft must not leak into this composer.
  const [editingComposer] = useState(
    () =>
      new MessageComposerController({
        client,
        compositionContext: channel,
        config: { drafts: { enabled: false } },
      }),
  );

  const { editing } = useStateStore(editingComposer.state, editingSelector);

  // Turning the setting off mid-edit abandons the edit, rather than leaving the message stuck as a
  // composer with no way back.
  useEffect(() => {
    if (!inlineEditEnabled && editing) editingComposer.clear();
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
            editingComposer.initState({ composition: message });
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
  }, [OuterMessageActions, editingComposer]);

  if (!inlineEditEnabled) return <DefaultMessageUI {...props} />;

  if (editing) {
    return (
      <MessageComposerControllerProvider messageComposerController={editingComposer}>
        <div className='app__inline-edit-message'>
          {/* Cancelling is the ✕ on the composer's edit preview, which clears the composer. */}
          <MessageComposer preventClearingOnUnmount />
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
