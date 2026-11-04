import type { PropsWithChildren } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { LocalMessage, MessageComposerState } from 'stream-chat';
import { MessageComposer as MessageComposerController } from 'stream-chat';
import { useChatContext } from 'stream-chat-react';

/** The message being edited, the list it is edited in, and the composer that holds the edit. */
export type InlineEdit = {
  composer: MessageComposerController;
  messageId: string;
  threadList: boolean;
};

type InlineEditContextValue = {
  edit: InlineEdit | null;
  startEditing: (message: LocalMessage, threadList: boolean) => void;
};

const InlineEditContext = createContext<InlineEditContextValue>({
  edit: null,
  startEditing: () => undefined,
});

export const useInlineEdit = () => useContext(InlineEditContext);

const editedMessageSelector = (state: MessageComposerState) => ({
  editedMessage: state.editedMessage,
});

/** Owns the edit composer: at most one message is edited at a time. */
export const InlineEditProvider = ({ children }: PropsWithChildren) => {
  const { client } = useChatContext();
  const [edit, setEdit] = useState<InlineEdit | null>(null);
  // The edit in progress, read when a new one starts, so its composer is emptied exactly once.
  const editRef = useRef(edit);
  useEffect(() => {
    editRef.current = edit;
  }, [edit]);

  const startEditing = useCallback(
    (message: LocalMessage, threadList: boolean) => {
      // The composition context is the message, so this composer edits only that message.
      const composer = new MessageComposerController({
        client,
        composition: message,
        compositionContext: message,
      });
      editRef.current?.composer.clear();
      setEdit({ composer, messageId: message.id, threadList });
    },
    [client],
  );

  // Saving or cancelling empties the composer, which ends the edit.
  useEffect(() => {
    if (!edit) return;
    return edit.composer.state.subscribeWithSelector(
      editedMessageSelector,
      ({ editedMessage }) => {
        if (!editedMessage) setEdit((current) => (current === edit ? null : current));
      },
    );
  }, [edit]);

  const value = useMemo(() => ({ edit, startEditing }), [edit, startEditing]);

  return (
    <InlineEditContext.Provider value={value}>{children}</InlineEditContext.Provider>
  );
};
