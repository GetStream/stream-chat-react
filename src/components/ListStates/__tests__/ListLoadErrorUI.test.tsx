import React from 'react';
import type { ReactElement } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import {
  type ListLoadErrorRetryButtonProps,
  ListLoadErrorUI,
  type ListLoadErrorUIComponentProps,
} from '../ListLoadErrorUI';
import { ListLoadErrorIndicator } from '../ListStates.deprecated';
import { Chat } from '../../Chat';
import { getTestClientWithUser } from '../../../mock-builders';
import { axe } from '../../../../axe-helper';

afterEach(cleanup);

const renderIndicator = async ({
  isRetrying = false,
  retry = vi.fn(),
  ...props
}: Partial<ListLoadErrorUIComponentProps> = {}) => {
  const client = await getTestClientWithUser({ id: 'user_x' });
  const result = render(
    <Chat client={client}>
      <ListLoadErrorUI
        error={new Error('query failed')}
        isRetrying={isRetrying}
        retry={retry}
        {...props}
      />
    </Chat>,
  );
  return { ...result, retry };
};

describe('ListLoadErrorUI', () => {
  it('renders under its deprecated 15.0 name ListLoadErrorIndicator with the same props', () => {
    const props = { error: new Error('failed'), isRetrying: false, retry: vi.fn() };
    const element = ListLoadErrorIndicator(props) as ReactElement;
    expect(element.type).toBe(ListLoadErrorUI);
    expect(element.props).toEqual(props);
  });

  it('explains that the list failed to load', async () => {
    const { container } = await renderIndicator();

    expect(screen.getByText("Couldn't load the list")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute(
      'class',
      'str-chat__list-load-error',
    );
  });

  it.each([
    ['channel', "Couldn't load conversations"],
    ['thread', "Couldn't load threads"],
  ] as const)(
    'explains that the %s list failed to load for the deprecated listType',
    async (listType, text) => {
      const { container } = await renderIndicator({ listType });

      expect(screen.getByText(text)).toBeInTheDocument();
      expect(container.firstElementChild).toHaveClass(
        'str-chat__list-load-error',
        `str-chat__${listType}-list-load-error`,
      );
    },
  );

  it('adds the className to its root', async () => {
    const { container } = await renderIndicator({ className: 'app-load-error' });

    expect(container.firstElementChild).toHaveClass(
      'str-chat__list-load-error',
      'app-load-error',
    );
  });

  it('renders a custom Title, also over the deprecated listType', async () => {
    const Title = () => <>Inbox is unavailable</>;
    await renderIndicator({ listType: 'channel', Title });

    expect(screen.getByText('Inbox is unavailable')).toBeInTheDocument();
    expect(screen.queryByText("Couldn't load conversations")).not.toBeInTheDocument();
  });

  it('renders a custom Icon with the icon class', async () => {
    const Icon = ({ className }: { className?: string }) => (
      <span className={className} data-testid='app-icon' />
    );
    await renderIndicator({ Icon });

    expect(screen.getByTestId('app-icon')).toHaveClass('str-chat__list-load-error__icon');
  });

  it('renders a custom RetryButton with isRetrying and retry', async () => {
    const RetryButton = ({ isRetrying, retry }: ListLoadErrorRetryButtonProps) => (
      <button onClick={retry} type='button'>
        {isRetrying ? 'Reloading' : 'Reload'}
      </button>
    );
    const { retry } = await renderIndicator({ isRetrying: true, RetryButton });

    fireEvent.click(screen.getByRole('button', { name: 'Reloading' }));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('retries when the button is clicked', async () => {
    const { retry } = await renderIndicator();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('keeps the button focusable but busy while a retry runs', async () => {
    await renderIndicator({ isRetrying: true });

    const button = screen.getByRole('button', { name: 'Try again' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
  });

  it('shows a spinner in the button while a retry runs', async () => {
    await renderIndicator({ isRetrying: true });

    expect(
      screen
        .getByRole('button', { name: 'Try again' })
        .querySelector('.str-chat__loading-indicator'),
    ).toBeInTheDocument();
  });

  it('shows no spinner in the button while no retry runs', async () => {
    await renderIndicator();

    expect(
      screen
        .getByRole('button', { name: 'Try again' })
        .querySelector('.str-chat__loading-indicator'),
    ).not.toBeInTheDocument();
  });

  it('passes axe checks', async () => {
    const { container } = await renderIndicator();

    expect(await axe(container)).toHaveNoViolations();
  });
});
