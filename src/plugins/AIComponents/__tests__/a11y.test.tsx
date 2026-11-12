import React, { type ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import {
  AIConversation,
  AIMessageComposer,
  AIStateIndicator,
  AISuggestions,
  type AIToolApprover,
  AIToolAuthorizationCard,
  parseMessageParts,
  VoiceGlow,
  VoiceWave,
} from '..';
import { Item } from '../AIMessageComposer/AttachmentPreview';
import { TranslationProvider } from '../../../context';
import { mockT } from '../../../mock-builders/translator';
import { axe } from '../../../../axe-helper';
import {
  installFakeSpeechRecognition,
  uninstallFakeSpeechRecognition,
} from './fakeSpeechRecognition';

const WithEnglish = ({ children }: { children: ReactNode }) => (
  <TranslationProvider
    value={{
      t: mockT as never,
      tDateTimeParser: (() => null) as never,
      userLanguage: 'en',
    }}
  >
    {children}
  </TranslationProvider>
);

const FullComposer = () => (
  <WithEnglish>
    <AIMessageComposer aria-label='Message composer'>
      <AIMessageComposer.FileInput name='attachments' />
      <AIMessageComposer.TextInput />
      <AIMessageComposer.SpeechToTextButton />
      <AIMessageComposer.SubmitButton />
    </AIMessageComposer>
  </WithEnglish>
);

// jsdom cannot compute pseudo-element styles, so axe's color-contrast rule cannot run
// meaningfully here and only emits "Not implemented" noise.
const axeRules = { rules: { 'color-contrast': { enabled: false } } };

const approver: AIToolApprover = {
  authorizer: { connect: () => Promise.resolve(true), decline: () => Promise.resolve() },
  clientId: 'web-1',
  decide: () => Promise.resolve(),
  userId: 'alex',
};

const replyParts = parseMessageParts([
  { duration_ms: 3000, id: 'r1', preview: 'Thinking about the weather.', status: 'completed', type: 'ai_reasoning', v: 1 },
  { approval: { title: 'Share your location?' }, executor: 'client', id: 'call_1', name: 'get_location', status: 'awaiting_approval', target_client_id: 'web-1', target_user_id: 'alex', type: 'ai_tool_call', v: 1 },
  { authorization: { provider: 'linear', provider_name: 'Linear', title: 'Connect Linear', type: 'oauth', url: 'https://router.example.com/launch/abc' }, id: 'call_2', name: 'linear_create_issue', status: 'awaiting_authorization', target_user_id: 'alex', type: 'ai_tool_call', v: 1 },
  { id: 'call_3', name: 'get_weather', status: 'completed', summary: 'Sunny, 21°C', type: 'ai_tool_call', v: 1 },
]); // prettier-ignore

describe('AI components accessibility', () => {
  beforeEach(() => {
    installFakeSpeechRecognition();
  });
  afterEach(() => {
    uninstallFakeSpeechRecognition();
  });

  it('a full composer has no axe violations', async () => {
    const { container } = render(<FullComposer />);
    // jsdom cannot compute pseudo-element styles, so axe's color-contrast rule cannot run
    // meaningfully here and only emits "Not implemented" noise.
    expect(
      await axe(container, { rules: { 'color-contrast': { enabled: false } } }),
    ).toHaveNoViolations();
  });

  it('an inline composer with its actions and a stop button has no axe violations', async () => {
    const { container } = render(
      <WithEnglish>
        <AIMessageComposer aria-label='Message composer' layout='inline'>
          <AIMessageComposer.TextInput />
          <AIMessageComposer.Actions>
            <AIMessageComposer.SpeechToTextButton />
            <AIMessageComposer.StopButton />
          </AIMessageComposer.Actions>
        </AIMessageComposer>
      </WithEnglish>,
    );
    expect(await axe(container, axeRules)).toHaveNoViolations();
  });

  it('names the submit button and the file upload control', () => {
    render(<FullComposer />);
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute(
      'type',
      'submit',
    );
    expect(screen.getByLabelText('File upload')).toHaveAttribute('type', 'file');
    expect(screen.getByRole('button', { name: 'Start voice input' })).toBeInTheDocument();
  });

  it('makes the native file input the single keyboard stop for file upload', () => {
    const { container } = render(<FullComposer />);
    const fileInput = screen.getByLabelText('File upload') as HTMLInputElement;
    const label = container.querySelector(`label[for="${fileInput.id}"]`);

    // reachable with Tab (natively opens the picker on Enter/Space) …
    expect(fileInput.style.display).not.toBe('none');
    expect(fileInput.tabIndex).toBe(0);
    fileInput.focus();
    expect(fileInput).toHaveFocus();
    // … and the pointer-only label is not a second, unnamed tab stop
    expect(label).toBeInTheDocument();
    expect(label).not.toHaveAttribute('tabindex');
  });

  it('removes the file input from the tab order when disabled', () => {
    render(
      <WithEnglish>
        <AIMessageComposer disabled>
          <AIMessageComposer.FileInput name='attachments' />
        </AIMessageComposer>
      </WithEnglish>,
    );
    expect(screen.getByLabelText('File upload')).toBeDisabled();
  });

  it('labels the retry button with its action', () => {
    render(
      <WithEnglish>
        <Item file={new File(['x'], 'a.txt', { type: 'text/plain' })} state='failed' />
      </WithEnglish>,
    );
    expect(screen.getByRole('button', { name: 'Retry upload' })).toBeInTheDocument();
  });

  it('voice visualizations have no axe violations and are named with their state', async () => {
    const { container } = render(
      <WithEnglish>
        <VoiceWave state='listening' />
        <VoiceGlow state='thinking' />
        <VoiceGlow rendering='css' state='speaking' />
      </WithEnglish>,
    );
    expect(await axe(container)).toHaveNoViolations();
    expect(
      screen.getByRole('img', { name: 'Voice agent: Listening' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Voice agent: Thinking' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Voice agent: Speaking' }),
    ).toBeInTheDocument();
  });

  it('announces the AI state politely', () => {
    render(<AIStateIndicator text='Thinking' />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Thinking');
  });
  it('a conversation with reasoning, tool calls, approval and sign-in has no axe violations', async () => {
    const { container } = render(
      <AIConversation
        approver={approver}
        messages={[
          { id: 'u1', role: 'user', text: 'What is the weather?' },
          { id: 'a1', parts: replyParts, role: 'assistant', text: 'It is **sunny**.' },
        ]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Allow' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
    expect(await axe(container, axeRules)).toHaveNoViolations();
  });

  it('the standalone sign-in card, suggestions and chat options have no axe violations', async () => {
    const { container } = render(
      <>
        <AIToolAuthorizationCard
          authorization={{ provider: 'linear', providerName: 'Linear', title: 'Connect Linear', type: 'oauth', url: 'https://router.example.com/launch/abc' }}
          onConnect={() => undefined}
          onDecline={() => undefined}
        />
        <AISuggestions onSelect={() => undefined} suggestions={['Plan my day', 'Summarise my inbox']} />
        <AIMessageComposer aria-label='Message composer'>
          <AIMessageComposer.TextInput />
          <AIMessageComposer.ChatOptions options={[{ id: 'think', title: 'Think harder' }]} />
        </AIMessageComposer>
      </>,
    ); // prettier-ignore
    fireEvent.click(screen.getByRole('button', { name: 'Chat options' }));
    expect(
      screen.getByRole('menuitemradio', { name: /Think harder/ }),
    ).toBeInTheDocument();
    // The open menu may render outside the container, so check the whole page. Its `region` rule
    // asks a page to keep its content in landmarks, which a test page without a <main> never does.
    expect(
      await axe(container.ownerDocument.body, {
        rules: { ...axeRules.rules, region: { enabled: false } },
      }),
    ).toHaveNoViolations();
  });
});
