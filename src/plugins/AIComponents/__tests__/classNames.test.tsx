import React from 'react';
import { render } from '@testing-library/react';

import {
  AIMarkdown,
  AIMessageComposer,
  AIStateIndicator,
  StreamingMessage,
  VoiceGlow,
  VoiceWave,
} from '..';

it('emits no legacy aicr__ classes', () => {
  const { container } = render(
    <>
      <AIMarkdown>{'```ts\nconst a = 1;\n```'}</AIMarkdown>
      <StreamingMessage text='hi' />
      <AIStateIndicator />
      <AIMessageComposer>
        <AIMessageComposer.TextInput />
        <AIMessageComposer.SubmitButton />
      </AIMessageComposer>
      <VoiceWave state='idle' />
      <VoiceGlow state='idle' />
    </>,
  );
  expect(container.innerHTML).not.toContain('aicr__');
  expect(
    container.querySelector('.str-chat__ai-message-composer__form'),
  ).toBeInTheDocument();
  expect(container.querySelector('.str-chat__ai-voice-wave')).toBeInTheDocument();
  expect(container.querySelector('.str-chat__ai-voice-glow')).toBeInTheDocument();
});
