import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Channel } from '../../../components/Channel';
import { Chat } from '../../../components/Chat';
import { ThemeScopeProvider } from '../../../context/ThemeScopeContext';
import { getTestClientWithUser, initClientWithChannels } from '../../../mock-builders';
import { ChatView } from '../../SlotLayout';
import {
  AIAssistantMessage,
  AIConversation,
  AIMarkdown,
  AIMessageComposer,
  AIToolArguments,
  AITypingIndicator,
  ChatOptionsList,
  StreamingMessage,
  VoiceWave,
} from '..';

const conversation = (
  <AIConversation
    messages={[
      { id: 'q', role: 'user', text: 'Hi' },
      { id: 'a', role: 'assistant', text: 'Hello' },
    ]}
  />
);

describe('AI components theme scope', () => {
  afterEach(cleanup);

  it('puts the str-chat scope on the root of a component rendered on its own', () => {
    const { container } = render(conversation);
    expect(container.firstElementChild).toHaveClass(
      'str-chat',
      'str-chat__ai-conversation',
    );
  });

  it('works without Chat, with the plain scope and no theme', () => {
    const { container } = render(
      <AIMessageComposer>
        <AIMessageComposer.TextInput />
      </AIMessageComposer>,
    );
    expect(container.firstElementChild?.className).toBe(
      'str-chat str-chat__ai-message-composer__form',
    );
  });

  it("takes Chat's theme and customClasses.chat", async () => {
    const client = await getTestClientWithUser({ id: 'user_x' });
    const { container } = render(
      <Chat
        client={client}
        customClasses={{ chat: 'my-chat' }}
        theme='str-chat__theme-dark'
      >
        <VoiceWave state='idle' />
      </Chat>,
    );
    const root = container.querySelector('.str-chat__ai-voice-wave');
    expect(root).toHaveClass('my-chat', 'str-chat__theme-dark');
    expect(root).not.toHaveClass('str-chat');
  });

  it('adds no scope inside one an ancestor provides', () => {
    const { container } = render(
      <div className='str-chat'>
        <ThemeScopeProvider>
          {conversation}
          <StreamingMessage text='Hi' />
        </ThemeScopeProvider>
      </div>,
    );
    expect(container.querySelectorAll('.str-chat')).toHaveLength(1);
  });

  it('nests no scope inside another AI component', () => {
    const { container } = render(conversation);
    // The conversation renders AIUserMessage, AIAssistantMessage and StreamingMessage inside it.
    expect(
      container.querySelector('.str-chat__ai-streaming-message'),
    ).toBeInTheDocument();
    expect(container.querySelectorAll('.str-chat')).toHaveLength(1);
  });

  it('scopes each standalone sibling on its own root', () => {
    const { container } = render(
      <>
        {conversation}
        <AIMessageComposer />
      </>,
    );
    const roots = [...container.children];
    expect(roots).toHaveLength(2);
    roots.forEach((root) => expect(root).toHaveClass('str-chat'));
  });

  it('adds no scope inside Channel, whose root has it', async () => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels();
    const { container } = render(
      <Chat client={client} theme='str-chat__theme-dark'>
        <Channel channel={channel}>
          {conversation}
          <AIMessageComposer />
        </Channel>
      </Chat>,
    );
    const scopes = container.querySelectorAll('.str-chat');
    expect(scopes).toHaveLength(1);
    expect(scopes[0]).toHaveClass('str-chat__channel', 'str-chat__theme-dark');
  });

  it('adds no scope inside ChatView, whose root has it', async () => {
    const client = await getTestClientWithUser({ id: 'user_x' });
    const { container } = render(
      <Chat client={client}>
        <ChatView>{conversation}</ChatView>
      </Chat>,
    );
    const scopes = container.querySelectorAll('.str-chat');
    expect(scopes).toHaveLength(1);
    expect(scopes[0]).toHaveClass('str-chat__chat-view');
  });

  it.each([
    ['AITypingIndicator', <AITypingIndicator key='t' text='Thinking' />],
    ['AIToolArguments', <AIToolArguments args={{ city: 'Oslo' }} key='a' />],
  ])('puts the scope on the root of %s rendered on its own', (_, element) => {
    const { container } = render(element);
    expect(container.firstElementChild).toHaveClass('str-chat');
  });

  it('gives ChatOptionsList, which has no root element, a layout-neutral scope wrapper', () => {
    const options = [{ id: 'think', title: 'Think harder' }];
    const { container } = render(
      <ChatOptionsList onSelect={() => undefined} options={options} />,
    );
    expect(container.firstElementChild).toHaveClass('str-chat', 'str-chat__theme-scope');
  });

  it('gives AIMarkdown, which has no root element, a layout-neutral scope wrapper', () => {
    const { container } = render(<AIMarkdown>{'**bold**'}</AIMarkdown>);
    expect(container.firstElementChild).toHaveClass('str-chat', 'str-chat__theme-scope');
  });

  it('adds no wrapper to AIMarkdown inside a scope', () => {
    const { container } = render(<AIAssistantMessage text='**bold**' />);
    expect(container.querySelectorAll('.str-chat')).toHaveLength(1);
    expect(container.querySelector('.str-chat__theme-scope')).not.toBeInTheDocument();
  });
});
