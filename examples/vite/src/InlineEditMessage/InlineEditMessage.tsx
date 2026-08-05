import {
  type ComponentProps,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { MessageComposer as MessageComposerController } from 'stream-chat';
import type { MessageComposerState } from 'stream-chat';
import { useChannelStateContext } from 'stream-chat-react';
import {
  ContextMenuButton,
  defaultMessageActionSet,
  IconEdit,
  MessageActions,
  type MessageActionSetItem,
  MessageComposer,
  MessageComposerControllerProvider,
  MessageUI,
  type MessageUIComponentProps,
  useChatContext,
  useComponentContext,
  useContextMenuContext,
  useMessageContext,
  useStateStore,
  useTranslationContext,
  WithComponents,
} from 'stream-chat-react';

type InlineEditContextValue = {
  isEditing: boolean;
  startEditing: () => void;
  stopEditing: () => void;
};

const InlineEditContext = createContext<InlineEditContextValue | undefined>(undefined);

const useInlineEditContext = () => {
  const value = useContext(InlineEditContext);
  if (!value) {
    throw new Error('useInlineEditContext must be used within an InlineEditableMessage');
  }
  return value;
};

const InlineEditAction = () => {
  const { closeMenu } = useContextMenuContext();
  const { startEditing } = useInlineEditContext();
  const { t } = useTranslationContext();

  return (
    <ContextMenuButton
      aria-label={t('aria/Edit Message Inline')}
      className='str-chat__message-actions-list-item-button'
      Icon={IconEdit}
      onClick={() => {
        startEditing();
        closeMenu();
      }}
    >
      {t('Edit inline')}
    </ContextMenuButton>
  );
};

const inlineEditActionSetItem: MessageActionSetItem = {
  Component: InlineEditAction,
  placement: 'dropdown',
  type: 'editInline',
};

const insertInlineEditAction = (
  actionSet: MessageActionSetItem[],
): MessageActionSetItem[] => {
  const editIndex = actionSet.findIndex((item) => 'type' in item && item.type === 'edit');

  if (editIndex < 0) return [...actionSet, inlineEditActionSetItem];

  return [
    ...actionSet.slice(0, editIndex),
    inlineEditActionSetItem,
    ...actionSet.slice(editIndex),
  ];
};

const InlineEditComposer = ({ onExit }: { onExit: () => void }) => {
  const { t } = useTranslationContext();

  return (
    <div className='app__inline-edit-message'>
      <MessageComposer preventClearingOnUnmount />
      <button className='app__inline-edit-message__cancel' onClick={onExit} type='button'>
        {t('Cancel')}
      </button>
    </div>
  );
};

const selector = (state: MessageComposerState) => ({
  editing: state.editedMessage != null,
});

export const InlineEditableMessage = (props: MessageUIComponentProps) => {
  const { client } = useChatContext();
  const { channel } = useChannelStateContext();
  const { message } = useMessageContext();

  const { MessageActions: OuterMessageActions = MessageActions } = useComponentContext();

  const [editingComposer] = useState(
    () =>
      new MessageComposerController({
        compositionContext: channel,
        client,
        config: { drafts: { enabled: false } },
      }),
  );

  const { editing } = useStateStore(editingComposer.state, selector);

  const startEditing = useCallback(() => {
    editingComposer.initState({ composition: message });
  }, [editingComposer, message]);
  const stopEditing = useCallback(() => {
    editingComposer.clear();
  }, [editingComposer]);

  const contextValue = useMemo<InlineEditContextValue>(
    () => ({ isEditing: editing, startEditing, stopEditing }),
    [editing, startEditing, stopEditing],
  );

  const MessageActionsWithInlineEdit = useMemo(() => {
    const Component = (actionsProps: ComponentProps<typeof MessageActions>) => {
      const messageActionSet = useMemo(
        () =>
          insertInlineEditAction(
            actionsProps.messageActionSet ?? defaultMessageActionSet,
          ),
        [actionsProps.messageActionSet],
      );

      return (
        <OuterMessageActions {...actionsProps} messageActionSet={messageActionSet} />
      );
    };
    Component.displayName = 'MessageActionsWithInlineEdit';
    return Component;
  }, [OuterMessageActions]);

  if (editing) {
    return (
      <MessageComposerControllerProvider messageComposerController={editingComposer}>
        <InlineEditComposer onExit={stopEditing} />
      </MessageComposerControllerProvider>
    );
  }

  return (
    <InlineEditContext.Provider value={contextValue}>
      <WithComponents overrides={{ MessageActions: MessageActionsWithInlineEdit }}>
        <MessageUI {...props} />
      </WithComponents>
    </InlineEditContext.Provider>
  );
};
