import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { ListLoadErrorIndicator } from '../ListLoadErrorIndicator';
import { Chat } from '../../Chat';
import { getTestClientWithUser } from '../../../mock-builders';
import { axe } from '../../../../axe-helper';

afterEach(cleanup);

const renderIndicator = async (
  listType: 'channel' | 'thread',
  { isRetrying = false, retry = vi.fn() } = {},
) => {
  const client = await getTestClientWithUser({ id: 'user_x' });
  const result = render(
    <Chat client={client}>
      <ListLoadErrorIndicator
        error={new Error('query failed')}
        isRetrying={isRetrying}
        listType={listType}
        retry={retry}
      />
    </Chat>,
  );
  return { ...result, retry };
};

describe('ListLoadErrorIndicator', () => {
  it.each([
    ['channel', "Couldn't load conversations"],
    ['thread', "Couldn't load threads"],
  ] as const)('explains that the %s list failed to load', async (listType, text) => {
    await renderIndicator(listType);

    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('retries when the button is clicked', async () => {
    const { retry } = await renderIndicator('thread');

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('keeps the button focusable but busy while a retry runs', async () => {
    await renderIndicator('channel', { isRetrying: true });

    const button = screen.getByRole('button', { name: 'Try again' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
  });

  it('passes axe checks', async () => {
    const { container } = await renderIndicator('channel');

    expect(await axe(container)).toHaveNoViolations();
  });
});
