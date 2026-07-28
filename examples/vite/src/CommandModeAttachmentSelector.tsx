import type { TextComposerState } from 'stream-chat';
import {
  type AttachmentSelectorProps,
  AttachmentSelector as DefaultAttachmentSelector,
  useMessageComposerController,
  useStateStore,
} from 'stream-chat-react';

const textComposerCommandSelector = ({ command }: TextComposerState) => ({ command });

export const CommandModeAttachmentSelector = (props: AttachmentSelectorProps) => {
  const messageComposer = useMessageComposerController();
  const { command } = useStateStore(
    messageComposer.textComposer.state,
    textComposerCommandSelector,
  );

  return (
    <DefaultAttachmentSelector
      {...props}
      // In command mode, keyboard flow should stay in command controls + textarea.
      // Removing the attachment trigger from tab order avoids an irrelevant stop.
      // Spread any incoming buttonProps first so ARIA/data props aren't dropped when this override
      // is wired globally via WithComponents.
      buttonProps={{ ...props.buttonProps, tabIndex: command ? -1 : undefined }}
    />
  );
};
