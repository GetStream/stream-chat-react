import React, { useMemo } from 'react';
import {
  AIAssistantMessage,
  AIConversation,
  type AIConversationAssistantMessageProps,
  type AIToolApprover,
  AIUIHost,
  ThemeScopeProvider,
} from 'stream-chat-react/ai-components';
import { createA2UIRenderer } from 'stream-chat-react/a2ui';
import { createOpenUIRenderer } from 'stream-chat-react/openui';

import { CLIENT_ID, messages, USER_ID } from './fixtures';

// Each cell of the gallery is a page: `?theme=light|dark&wrapper=inside|outside&tokens=default|app`.
// `inside` renders in a `.str-chat` element, as in a Stream app; `outside` renders without one,
// as an app that uses only the AI components does. `app` themes them with the SDK's tokens.
const params = new URLSearchParams(window.location.search);
export const theme = params.get('theme') === 'dark' ? 'dark' : 'light';
export const wrapper = params.get('wrapper') === 'outside' ? 'outside' : 'inside';
export const tokens = params.get('tokens') === 'app' ? 'app' : 'default';

const approver: AIToolApprover = {
  clientId: CLIENT_ID,
  decide: () => new Promise<void>(() => undefined),
  userId: USER_ID,
};

// The fallback an app shows for a reply that finished with neither its UI nor words.
const AssistantMessage = (props: AIConversationAssistantMessageProps) => {
  const { isGenerating, showsUI, text } = props;
  return (
    <>
      <AIAssistantMessage
        approver={props.approver}
        attachments={props.attachments}
        isGenerating={isGenerating}
        parts={props.parts}
        reasoningText={props.reasoningText}
        text={text}
      />
      {!isGenerating && !showsUI && text === '' && props.parts.length === 0 && (
        <p className='gallery__fallback' role='status'>
          {props.uiFailed
            ? 'The reply’s UI couldn’t be shown.'
            : 'Finished without a text reply.'}
        </p>
      )}
    </>
  );
};

export const App = () => {
  const ui = useMemo(
    () =>
      new AIUIHost({
        open: () => undefined,
        renderers: [createA2UIRenderer(), createOpenUIRenderer()],
        send: () => undefined,
      }),
    [],
  );
  const conversation = (
    <AIConversation
      approver={approver}
      AssistantMessage={AssistantMessage}
      messages={messages}
      ReplyActions={null}
      ui={ui}
    />
  );
  const themeClass = `str-chat__theme-${theme}`;
  // No <Chat> or TranslationProvider: outside one, the default translator renders each string's
  // inline English, as an app that uses only the AI components gets.
  return (
    <div
      className={[
        'gallery',
        // Outside a `.str-chat` element, each AI component carries the `str-chat` scope itself,
        // with no theme class (there is no <Chat>), so it is the SDK's light theme.
        wrapper === 'inside' ? `str-chat ${themeClass}` : undefined,
        tokens === 'app' ? `gallery--app-${theme}` : undefined,
      ]
        .filter(Boolean)
        .join(' ')}
      data-cell={`${theme}-${wrapper}-${tokens}`}
    >
      <header className='gallery__header'>
        {wrapper === 'outside' && tokens === 'default'
          ? 'outside .str-chat · the scope each AI component carries (light, no app tokens)'
          : `${theme} · ${wrapper} .str-chat · ${tokens} tokens`}
      </header>
      {wrapper === 'inside' ? (
        // The `.str-chat` element above is the scope, so the conversation adds none of its own,
        // which would reset its theme: as an app with its own `str-chat` element renders it.
        <ThemeScopeProvider>{conversation}</ThemeScopeProvider>
      ) : (
        conversation
      )}
    </div>
  );
};
