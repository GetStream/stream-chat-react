import type { Attachment, LocalMessage, MessageResponse } from 'stream-chat';

import { AI_UI_CUSTOM_DATA_KEY, parseAIUIDocument } from '../GenerativeUI/AIUIDocument';
import type { AIMessageAttachmentData } from '../Message/AIMessageAttachment';
import { parseMessageParts } from '../MessageParts/parseMessageParts';
import { isObject, withCustomFields } from '../utils';
import type { AIMessage, AIMessageBranch } from './types';

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

/** The custom field the backend marks a message's versions with. */
export const AI_BRANCH_CUSTOM_DATA_KEY = 'support_branch';

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

// `support_branch: { response_id, of, index, count, ... }`. A mark that doesn't add up (an
// unknown `of`, an index past the count) is left out: the message then shows as its only version.
const branchOf = (mark: unknown): AIMessageBranch | undefined => {
  if (!isObject(mark)) return undefined;
  const { count, index, of } = mark;
  if (of !== 'reply' && of !== 'question') return undefined;
  if (!isPositiveInteger(count) || !isPositiveInteger(index) || index > count) {
    return undefined;
  }
  return { count, index, of };
};

const responseIdOf = (mark: unknown) =>
  isObject(mark) && typeof mark.response_id === 'string' && mark.response_id !== ''
    ? mark.response_id
    : undefined;

/** The custom field the backend marks a re-sent copy of a message with, holding the original's id. */
export const AI_RESENT_FROM_CUSTOM_DATA_KEY = 'resent_from';

/**
 * Adapts a Stream message for `AIConversation`: a reply is one with `custom.ai_generated: true`,
 * it is being written while `custom.generating: true`, its steps are its `ai_reasoning` and
 * `ai_tool_call` attachments, its images and files are its other attachments, and the UI the
 * agent wrote for it is its `custom.ai_ui` field. A person's message has no UI, whatever its
 * fields say. Which of its versions a message is, and its agent response, are its
 * `custom.support_branch` field (`{ response_id, of, index, count }`), read as `branch` and
 * `responseId`. A copy the backend re-sent of an earlier message has `custom.resent_from`, read
 * as `resentFrom`.
 */
export const fromStreamMessage = <M extends StreamMessage>(
  message: M,
  { isAssistant, reasoningText }: FromStreamMessageOptions<M> = {},
): AIMessage => {
  const attachments = message.attachments ?? [];
  const fields = withCustomFields(message as unknown as Record<string, unknown>);
  const assistant = isAssistant ? isAssistant(message) : fields.ai_generated === true;
  const uiDocument = assistant
    ? parseAIUIDocument(fields[AI_UI_CUSTOM_DATA_KEY])
    : undefined;
  const mark = fields[AI_BRANCH_CUSTOM_DATA_KEY];
  const branch = branchOf(mark);
  const responseId = responseIdOf(mark);
  const resentFrom = fields[AI_RESENT_FROM_CUSTOM_DATA_KEY];
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
    ...(uiDocument ? { uiDocument } : {}),
    ...(branch ? { branch } : {}),
    ...(responseId ? { responseId } : {}),
    ...(typeof resentFrom === 'string' && resentFrom !== '' ? { resentFrom } : {}),
  };
};
