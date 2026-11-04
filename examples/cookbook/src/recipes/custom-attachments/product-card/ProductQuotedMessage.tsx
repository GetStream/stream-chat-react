import type { LocalMessage, MessageComposerState, MessageResponse } from 'stream-chat';
import type { QuotedMessagePreviewProps, QuotedMessageProps } from 'stream-chat-react';
import {
  QuotedMessagePreview,
  QuotedMessagePreviewUI,
  useMessageComposerController,
  useMessageContext,
  useMessagePaginator,
  useStateStore,
} from 'stream-chat-react';
import { describeProduct, findProductAttachment } from './product';

/**
 * The quoted preview shows the message's text, or a label for the attachment types it knows. A
 * product message has no text, so it gets one to show.
 */
const withProductText = <T extends LocalMessage | MessageResponse>(message: T): T => {
  const product = findProductAttachment(message);
  return product && !message.text
    ? { ...message, text: describeProduct(product) }
    : message;
};

/** The quote above a reply in the message list. */
export const ProductQuotedMessage = ({
  renderText: propsRenderText,
}: QuotedMessageProps) => {
  const { message, renderText: contextRenderText } = useMessageContext();
  const messagePaginator = useMessagePaginator();
  const quotedMessage = message.quoted_message;

  if (!quotedMessage) return null;

  return (
    <QuotedMessagePreviewUI
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void messagePaginator.jumpToMessage(quotedMessage.id);
      }}
      quotedMessage={withProductText(quotedMessage)}
      renderText={propsRenderText ?? contextRenderText}
    />
  );
};

const quotedMessageSelector = ({ quotedMessage }: MessageComposerState) => ({
  quotedMessage,
});

/** The quote above the composer's input while the user writes a reply. */
export const ProductQuotedMessagePreview = (props: QuotedMessagePreviewProps) => {
  const messageComposer = useMessageComposerController();
  const { quotedMessage } = useStateStore(messageComposer.state, quotedMessageSelector);

  if (!quotedMessage || !findProductAttachment(quotedMessage)) {
    return <QuotedMessagePreview {...props} />;
  }

  return (
    // The SDK's slot class keeps the quote placed as the default preview places it.
    <div className='str-chat__message-composer__quoted-message-preview-slot'>
      <QuotedMessagePreviewUI
        {...props}
        onRemove={() => messageComposer.setQuotedMessage(null)}
        quotedMessage={withProductText(quotedMessage)}
      />
    </div>
  );
};
