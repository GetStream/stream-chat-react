import React from 'react';
import { cleanup, render } from '@testing-library/react';
import type { LocalMessage, StreamChat, VoiceRecordingAttachment } from 'stream-chat';

import { SummarizedMessagePreview } from '../SummarizedMessagePreview';
import { ChatContext, TranslationContext } from '../../../context';
import {
  generateMessage,
  generateUser,
  generateVideoAttachment,
  getTestClientWithUser,
  mockChatContext,
  mockTranslationContextValue,
} from '../../../mock-builders';

let client: StreamChat;

const renderPreview = (
  latestMessage?: LocalMessage,
  isMessageAIGenerated?: (message: LocalMessage) => boolean,
) =>
  render(
    <ChatContext.Provider value={mockChatContext({ client, isMessageAIGenerated })}>
      <TranslationContext.Provider value={mockTranslationContextValue()}>
        <SummarizedMessagePreview latestMessage={latestMessage} />
      </TranslationContext.Provider>
    </ChatContext.Provider>,
  );

const previewText = (container: HTMLElement) =>
  container.querySelector('.str-chat__summarized-message-preview__text')?.textContent;

beforeAll(async () => {
  client = await getTestClientWithUser(generateUser({ id: 'own-user' }));
});

afterEach(cleanup);

describe('SummarizedMessagePreview', () => {
  it('shows the message text without markdown syntax', () => {
    const { container } = renderPreview(
      generateMessage({
        text: '**Done**: see [the PR](https://example.test/pr) and run `yarn test`',
        user: generateUser({ id: 'other-user' }),
      }),
    );
    expect(previewText(container)).toBe('Done: see the PR and run yarn test');
  });

  it('shows a table and a task list on one line with their markers', () => {
    const { container } = renderPreview(
      generateMessage({
        text: 'Status:\n\n| Area | State |\n| --- | --- |\n| API | **done** |\n\n- [x] ship\n- [ ] docs',
        user: generateUser({ id: 'other-user' }),
      }),
    );
    expect(previewText(container)).toBe(
      'Status: | Area | State | | API | done | - [x] ship - [ ] docs',
    );
  });

  it('strips the caption of an attachment and keeps its duration', () => {
    const { container } = renderPreview(
      generateMessage({
        attachments: [
          generateVideoAttachment({
            custom: { duration: 125 },
          } as Partial<VoiceRecordingAttachment>),
        ],
        text: 'look at **this**',
        user: generateUser({ id: 'other-user' }),
      }),
    );
    expect(previewText(container)).toBe('look at this (2:05)');
  });

  it('shows AI-generated text verbatim, as the channel row announces it', () => {
    const { container } = renderPreview(
      generateMessage({ text: '**keep me**', user: generateUser({ id: 'other-user' }) }),
      () => true,
    );
    expect(previewText(container)).toBe('**keep me**');
  });

  it('shows plain text as is', () => {
    const { container } = renderPreview(
      generateMessage({ text: 'hello there', user: generateUser({ id: 'other-user' }) }),
    );
    expect(previewText(container)).toBe('hello there');
  });
});
