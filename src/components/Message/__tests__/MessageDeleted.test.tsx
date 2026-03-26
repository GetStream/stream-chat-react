import React from 'react';
import { render } from '@testing-library/react';

import { MessageDeletedBubble } from '../MessageDeletedBubble';

import { TranslationProvider } from '../../../context/TranslationContext';
import { mockTranslationContextValue } from '../../../mock-builders';

const messageDeletedTestId = 'message-deleted-bubble';

function renderComponent() {
  const t = vi.fn((key) => key);

  return render(
    <TranslationProvider value={mockTranslationContextValue({ t })}>
      <MessageDeletedBubble />
    </TranslationProvider>,
  );
}

describe('MessageDeletedBubble component', () => {
  it('should inform that the message was deleted', () => {
    const { queryByText } = renderComponent();
    expect(queryByText('Message deleted')).toBeInTheDocument();
  });

  it('should render with correct test id', () => {
    const { queryByTestId } = renderComponent();
    expect(queryByTestId(messageDeletedTestId)).toBeInTheDocument();
  });
});
