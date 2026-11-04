import type { Attachment, LocalMessage, MessageResponse } from 'stream-chat';

import type { AIMessageAttachmentData } from '../Message/AIMessageAttachment';
import { parseMessageParts } from '../MessageParts/parseMessageParts';
import { withCustomFields } from '../utils';
import type { AIMessage } from './types';

/** What the adapter reads of a message: a `LocalMessage` or a `MessageResponse` will do. */
type StreamMessage = Pick<LocalMessage | MessageResponse, 'attachments' | 'id' | 'text'>;

export type FromStreamMessageOptions<M extends StreamMessage = StreamMessage> = {
  /** Whether the agent wrote it. Defaults to the message's `custom.ai_generated` field. */
  isAssistant?: (message: M) => boolean;
  /** The whole of a reasoning step's thinking, when the app has it, such as from live updates. */
  reasoningText?: (messageId: string, stepId: string) => string | undefined;
};

// Images and files only: the steps (`ai_*`) are read as parts, and other kinds are the app's.
const attachmentOf = (attachment: Attachment): AIMessageAttachmentData | undefined => {
  const name = attachment.title ?? attachment.fallback ?? undefined;
  // stream-chat keeps the file's size and type under `custom`.
  const { file_size, mime_type } = attachment.custom ?? {};
  if (attachment.type === 'image') {
    const url = attachment.image_url ?? attachment.asset_url ?? attachment.thumb_url;
    return url ? { kind: 'image', mimeType: mime_type, name, url } : undefined;
  }
  if (attachment.type === 'file') {
    const size = Number(file_size);
    return attachment.asset_url
      ? {
          kind: 'file',
          mimeType: mime_type,
          name,
          size: Number.isFinite(size) && size > 0 ? size : undefined,
          url: attachment.asset_url,
        }
      : undefined;
  }
  return undefined;
};

/**
 * Adapts a Stream message for `AIConversation`: a reply is one with `custom.ai_generated: true`,
 * it is being written while `custom.generating: true`, its steps are its `ai_reasoning` and
 * `ai_tool_call` attachments, and its images and files are its other attachments.
 */
export const fromStreamMessage = <M extends StreamMessage>(
  message: M,
  { isAssistant, reasoningText }: FromStreamMessageOptions<M> = {},
): AIMessage => {
  const attachments = message.attachments ?? [];
  const fields = withCustomFields(message as unknown as Record<string, unknown>);
  const assistant = isAssistant ? isAssistant(message) : fields.ai_generated === true;
  return {
    attachments: attachments
      .map(attachmentOf)
      .filter((attachment): attachment is AIMessageAttachmentData => !!attachment),
    id: message.id,
    isGenerating: fields.generating === true,
    parts: parseMessageParts(attachments),
    reasoningText: reasoningText
      ? (stepId: string) => reasoningText(message.id, stepId)
      : undefined,
    role: assistant ? 'assistant' : 'user',
    text: message.text ?? '',
  };
};
