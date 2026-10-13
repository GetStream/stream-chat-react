import React from 'react';
import { render } from '@testing-library/react';

import { AIMarkdown, AIMessageComposer, AIStateIndicator, StreamingMessage } from '..';

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
    </>,
  );
  expect(container.innerHTML).not.toContain('aicr__');
  expect(
    container.querySelector('.str-chat__ai-message-composer__form'),
  ).toBeInTheDocument();
});
