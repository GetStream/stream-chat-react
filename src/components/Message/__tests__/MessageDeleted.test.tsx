import React from 'react';
import { render } from '@testing-library/react';

import { MessageDeletedBubble } from '../MessageDeletedBubble';

import { TranslationProvider } from '../../../context/TranslationContext';

const messageDeletedTestId = 'message-deleted-bubble';

function renderComponent() {
  const t = vi.fn((key) => key);

  return render(
    <TranslationProvider value={{ t } as any}>
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
