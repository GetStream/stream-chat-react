import React, { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';

import { AIMessageComposer, AIStateIndicator } from '..';
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

  it('announces the AI state politely', () => {
    render(<AIStateIndicator text='Thinking' />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Thinking');
  });
});
