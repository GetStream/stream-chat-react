import React, { Component, type ReactNode } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import type { AIUIDocument } from './AIUIDocument';
import { AIUIEntranceStage } from './AIUIEntrance';
import type { AIUIHost } from './AIUIHost';

type AIUIErrorBoundaryProps = {
  children: ReactNode;
  onError: (error: unknown) => void;
};

// Keeps a reply's UI that throws while it renders, such as an app's component given what it
// didn't expect, from taking the conversation down with it. It shows nothing and says so, and
// the host shows the reply's text.
class AIUIErrorBoundary extends Component<AIUIErrorBoundaryProps, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/**
 * A reply's generated UI as it shows in place of the reply's text: as wide as the reply, coming
 * in as it first shows while the agent writes it. UI that throws while it renders shows nothing,
 * and `onError` is told, such as to have the host show the reply's text.
 */
export const AIUIGenerated = ({
  children,
  isStreaming,
  onError,
}: {
  children: ReactNode;
  isStreaming: boolean;
  onError: (error: unknown) => void;
}) => (
  <AIUIEntranceStage className='str-chat__ai-ui' isStreaming={isStreaming}>
    <AIUIErrorBoundary onError={onError}>{children}</AIUIErrorBoundary>
  </AIUIEntranceStage>
);

const subscribeToNothing = () => () => undefined;
const noVersion = () => 0;

/**
 * Shows the conversation's replies again whenever the host says what one of them shows changed,
 * such as once a renderer's runtime loads.
 */
export const useAIUIHostRefresh = (host: AIUIHost | undefined) =>
  useSyncExternalStore(
    host ? host.subscribe : subscribeToNothing,
    host ? host.getVersion : noVersion,
    host ? host.getVersion : noVersion,
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
 * `host.content(document, messageId) !== null` tells which, and `host.subscribe` when that may
 * have changed. Give the host the conversation's messages with `host.receive(messages)` as they
 * change. The counterpart of `AIUIView` in StreamChatAI.
 */
export const AIUIView = ({ document, host, messageId }: AIUIViewProps) => {
  useAIUIHostRefresh(host);
  const content = host.content(document, messageId);
  return content === null ? null : (
    <AIUIGenerated
      isStreaming={document.isStreaming}
      onError={(error) => host.fail(messageId, error)}
    >
      {content}
    </AIUIGenerated>
  );
};
