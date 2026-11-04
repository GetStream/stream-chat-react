import React from 'react';
import clsx from 'clsx';

import { AIMessageParts } from '../MessageParts/AIMessageParts';
import type { AIMessagePartData } from '../MessageParts/types';
import { StreamingMessage } from '../StreamingMessage/StreamingMessage';
import type { AIToolApprover } from '../ToolCalls/AIToolApprover';
import { AIMessageAttachment, type AIMessageAttachmentData } from './AIMessageAttachment';

export type AIAssistantMessageProps = {
  /** The answer, in Markdown. */
  text: string;
  /**
   * Who answers tool calls' questions and sign-ins on this device, to ask them. Defaults to the
   * one of the nearest `AIToolApproverProvider`.
   */
  approver?: AIToolApprover;
  /** What the agent sent with it, such as images and files. */
  attachments?: AIMessageAttachmentData[];
  className?: string;
  /** Whether the agent is still writing it. The text that arrives meanwhile is typed out. */
  isGenerating?: boolean;
  /** The steps the agent took, in order, shown before the answer. */
  parts?: AIMessagePartData[];
  /** The whole of a reasoning step's thinking, when the app has it. */
  reasoningText?: (stepId: string) => string | undefined;
};

/**
 * The agent's reply: its steps (reasoning, tool calls and their questions), then its answer,
 * typed out as it streams in, then what it sent with it. The counterpart of
 * `AIAssistantMessageView`.
 */
export const AIAssistantMessage = ({
  approver,
  attachments = [],
  className,
  isGenerating = false,
  parts = [],
  reasoningText,
  text,
}: AIAssistantMessageProps) => (
  <div
    aria-busy={isGenerating}
    className={clsx(
      'str-chat__ai-assistant-message',
      isGenerating && 'str-chat__ai-assistant-message--generating',
      className,
    )}
  >
    {parts.length > 0 && (
      <AIMessageParts approver={approver} parts={parts} reasoningText={reasoningText} />
    )}
    {/* What arrives after mount is typed out; a reply loaded from history shows at once. */}
    {text !== '' && <StreamingMessage text={text} />}
    {attachments.length > 0 && (
      <div className='str-chat__ai-assistant-message__attachments'>
        {attachments.map((attachment, index) => (
          <AIMessageAttachment attachment={attachment} key={index} role='assistant' />
        ))}
      </div>
    )}
  </div>
);
