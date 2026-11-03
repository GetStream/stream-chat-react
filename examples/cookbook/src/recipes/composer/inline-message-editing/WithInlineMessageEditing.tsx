import type { PropsWithChildren } from 'react';
import {
  MessageUI,
  useMessageContext,
  useThreadContext,
  WithComponents,
} from 'stream-chat-react';
import { InlineEditMessageActions } from './InlineEditAction';
import { InlineEditor } from './InlineEditor';
import { InlineEditProvider, useInlineEdit } from './InlineEditContext';

const InlineEditingMessageUI = () => {
  const { message } = useMessageContext();
  const isInThread = !!useThreadContext();
  const { edit } = useInlineEdit();

  // The same message can show in the channel and in its thread; only the list it was opened in
  // shows the editor.
  const isEditedHere = edit?.messageId === message.id && edit.isInThread === isInThread;

  return isEditedHere ? <InlineEditor composer={edit.composer} /> : <MessageUI />;
};

// Declared once, so WithComponents gets the same object on every render.
const overrides = {
  MessageActions: InlineEditMessageActions,
  MessageUI: InlineEditingMessageUI,
};

export const WithInlineMessageEditing = ({ children }: PropsWithChildren) => (
  <InlineEditProvider>
    <WithComponents overrides={overrides}>{children}</WithComponents>
  </InlineEditProvider>
);
