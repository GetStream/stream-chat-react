import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { axe } from '../../../../axe-helper';

import { NewMessageNotification } from '../NewMessageNotification';
import { Chat } from '../../Chat';
import { getTestClient } from '../../../mock-builders';

afterEach(cleanup);

const renderComponent = async (props = {}) => {
  let result;
  await act(() => {
    result = render(
      <Chat client={getTestClient()}>
        <NewMessageNotification {...props} />
      </Chat>,
    );
  });
  return result;
};

describe('NewMessageNotification', () => {
  it('should render nothing if showNotification is false', async () => {
    await renderComponent({ showNotification: false });
    expect(screen.queryByTestId('message-notification')).not.toBeInTheDocument();
  });

  it('should render nothing if showNotification is undefined', async () => {
    await renderComponent();
    expect(screen.queryByTestId('message-notification')).not.toBeInTheDocument();
  });

  it('should render notification when showNotification is true', async () => {
    const { container } = await renderComponent({ showNotification: true });
    const notification = screen.getByTestId('message-notification');
    expect(notification).toBeInTheDocument();
    expect(notification).toHaveClass('str-chat__message-notification__label');
    expect(notification).toHaveAttribute('aria-live', 'polite');
    expect(notification).toHaveTextContent('New Messages!');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should display message count when newMessageCount is provided', async () => {
    await renderComponent({ newMessageCount: 5, showNotification: true });
    const notification = screen.getByTestId('message-notification');
    expect(notification).toHaveTextContent('5 new messages');
  });

  it('should have the correct wrapper class', async () => {
    await renderComponent({ showNotification: true });
    const wrapper = screen.getByTestId('message-notification').parentElement;
    expect(wrapper).toHaveClass('str-chat__new-message-notification');
  });
});
