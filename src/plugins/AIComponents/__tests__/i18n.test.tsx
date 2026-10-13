import React from 'react';
import { render, screen } from '@testing-library/react';

import { AIMessageComposer, AIStateIndicator } from '..';
import { Item } from '../AIMessageComposer/AttachmentPreview';
import { TranslationProvider } from '../../../context';
import {
  installFakeSpeechRecognition,
  uninstallFakeSpeechRecognition,
} from './fakeSpeechRecognition';

// Echoes the key, so an assertion proves which key a component asked for.
const t = ((key: string) => `T:${key}`) as never;

const WithKeyEcho = ({ children }: { children: React.ReactNode }) => (
  <TranslationProvider
    value={{ t, tDateTimeParser: (() => null) as never, userLanguage: 'en' }}
  >
    {children}
  </TranslationProvider>
);

const STATE_INDICATOR_KEYS = [
  'aiComponents.stateIndicator.thinkingReallyHard.text',
  'aiComponents.stateIndicator.puttingOnMyThinkingCap.text',
  'aiComponents.stateIndicator.consultingTheAiGods.text',
  'aiComponents.stateIndicator.brewingUpAnAnswer.text',
  'aiComponents.stateIndicator.crunchingTheNumbers.text',
  'aiComponents.stateIndicator.readingTheDigitalTeaLeaves.text',
  'aiComponents.stateIndicator.firingUpTheNeurons.text',
  'aiComponents.stateIndicator.summoningMyInnerGenius.text',
  'aiComponents.stateIndicator.connectingTheDots.text',
  'aiComponents.stateIndicator.workingMyMagic.text',
  'aiComponents.stateIndicator.channelingMyInnerEinstein.text',
  'aiComponents.stateIndicator.cookingUpSomethingGood.text',
];

describe('AI components i18n', () => {
  beforeEach(() => {
    installFakeSpeechRecognition();
  });
  afterEach(() => {
    uninstallFakeSpeechRecognition();
    vi.restoreAllMocks();
  });

  describe('with a translator that echoes the requested key', () => {
    it('translates the composer placeholder', () => {
      render(
        <WithKeyEcho>
          <AIMessageComposer>
            <AIMessageComposer.TextInput />
          </AIMessageComposer>
        </WithKeyEcho>,
      );
      expect(
        screen.getByPlaceholderText(
          'T:aiComponents.messageComposer.textInput.placeholder',
        ),
      ).toBeInTheDocument();
    });

    it('uses the v15 keys for the composer controls', () => {
      render(
        <WithKeyEcho>
          <AIMessageComposer>
            <AIMessageComposer.FileInput name='attachments' />
            <AIMessageComposer.SpeechToTextButton />
            <AIMessageComposer.SubmitButton />
          </AIMessageComposer>
        </WithKeyEcho>,
      );
      expect(
        screen.getByLabelText('T:fileUpload.uploadButton.fileUpload.ariaLabel'),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('T:aiComponents.messageComposer.speechToText.ariaLabel'),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('T:messageComposer.sendButton.send.ariaLabel'),
      ).toBeInTheDocument();
    });

    it('uses the v15 keys for the attachment preview', () => {
      render(
        <WithKeyEcho>
          <Item file={new File(['x'], '', { type: 'text/plain' })} state='failed' />
        </WithKeyEcho>,
      );
      expect(
        screen.getByLabelText(
          'T:aiComponents.attachmentPreview.deleteAttachment.ariaLabel',
        ),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('T:common.retryUpload.ariaLabel')).toBeInTheDocument();
      expect(
        screen.getByText('T:aiComponents.attachmentPreview.unknownFileName.text'),
      ).toBeInTheDocument();
    });

    it('translates state indicator messages with one literal key per message', () => {
      const seen = new Set<string>();
      STATE_INDICATOR_KEYS.forEach((_, index) => {
        vi.spyOn(Math, 'random').mockReturnValue(index / STATE_INDICATOR_KEYS.length);
        const { container, unmount } = render(
          <WithKeyEcho>
            <AIStateIndicator />
          </WithKeyEcho>,
        );
        seen.add(container.textContent?.replace(/^T:/, '') ?? '');
        unmount();
      });
      expect([...seen].sort()).toEqual([...STATE_INDICATOR_KEYS].sort());
    });
  });

  describe('without a provider (inline English defaults)', () => {
    it('renders real English values for aria keys (no aria/ prefix)', () => {
      render(
        <AIMessageComposer>
          <AIMessageComposer.SpeechToTextButton />
        </AIMessageComposer>,
      );
      expect(screen.getByLabelText('Start voice input')).toBeInTheDocument();
    });

    it('renders the English placeholder and a known state indicator message', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const { container } = render(
        <>
          <AIMessageComposer>
            <AIMessageComposer.TextInput />
          </AIMessageComposer>
          <AIStateIndicator />
        </>,
      );
      expect(screen.getByPlaceholderText('Ask a question...')).toBeInTheDocument();
      expect(container.textContent).toContain('Thinking really hard');
    });
  });
});
