import React, { type ReactNode } from 'react';

import type { AIUIDocument } from './AIUIDocument';
import { AIUIEntranceStage } from './AIUIEntrance';
import type { AIUIHost } from './AIUIHost';

/**
 * A reply's generated UI as it shows in place of the reply's text: as wide as the reply, coming
 * in as it first shows while the agent writes it.
 */
export const AIUIGenerated = ({
  children,
  isStreaming,
}: {
  children: ReactNode;
  isStreaming: boolean;
}) => (
  <AIUIEntranceStage className='str-chat__ai-ui' isStreaming={isStreaming}>
    {children}
  </AIUIEntranceStage>
);

export type AIUIViewProps = {
  document: AIUIDocument;
  host: AIUIHost;
  /** The reply the document belongs to. */
  messageId: string;
};

/**
 * One reply's generated UI, for showing replies outside `AIConversation`. It shows nothing when
 * none of the host's renderers shows the document, and the reply's text should show instead:
 * `host.content(document, messageId) !== null` tells which beforehand. Give the host the
 * conversation's messages with `host.receive(messages)` as they change. The counterpart of
 * `AIUIView` in StreamChatAI.
 */
export const AIUIView = ({ document, host, messageId }: AIUIViewProps) => {
  const content = host.content(document, messageId);
  return content === null ? null : (
    <AIUIGenerated isStreaming={document.isStreaming}>{content}</AIUIGenerated>
  );
};
