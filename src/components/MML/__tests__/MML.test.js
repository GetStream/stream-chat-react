import React from 'react';

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { MML } from '../MML';
import { ChatProvider } from '../../../context/ChatContext';
import { MessageProvider } from '../../../context/MessageContext';

afterEach(cleanup); // eslint-disable-line

const renderComponent = async ({ chatCtx = {}, messageCtx = {}, mmlProps }) => {
  let result;
  await act(() => {
    result = render(
      <ChatProvider value={chatCtx}>
        <MessageProvider value={messageCtx}>
          <MML {...mmlProps} />
        </MessageProvider>
      </ChatProvider>,
    );
  });
  return result;
};

describe('MML', () => {
  it('should render mml form without any source', async () => {
    const { container } = await renderComponent({ mmlProps: { source: '' } });
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="mml-container  mml-align-right"
          data-testid="mml-container"
        >
          <form
            class="mml-wrap"
            data-testid="mml-form"
          />
        </div>
      </div>
    `);
  }, 10000);

  it('should render a basic mml', async () => {
    const { container } = await renderComponent({
      mmlProps: { source: '<mml>Some Text</mml>' },
    });

    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="mml-container  mml-align-right"
          data-testid="mml-container"
        >
          <form
            class="mml-wrap"
            data-testid="mml-form"
          >
            <div
              class="mml-text"
            >
              Some Text
            </div>
          </form>
        </div>
      </div>
    `);
  });

  it('should render with different align prop', async () => {
    const { rerender } = await renderComponent({
      mmlProps: { align: 'left', source: '<mml></mml>' },
    });

    expect(screen.getByTestId('mml-container')).toHaveClass('mml-align-left');

    rerender(
      <ChatProvider value={{}}>
        <MessageProvider value={{}}>
          <MML align='right' source='<mml></mml>' />
        </MessageProvider>
      </ChatProvider>,
    );
    expect(screen.getByTestId('mml-container')).toHaveClass('mml-align-right');
  });

  it('should pass down themes from chat context', async () => {
    await renderComponent({
      chatCtx: { theme: 'team dark' },
      mmlProps: { source: '<mml></mml>' },
    });

    expect(screen.getByTestId('mml-container')).toHaveClass('team-dark');
  });

  it('actionHandler should be called', async () => {
    const handler = jest.fn();
    await renderComponent({
      mmlProps: { actionHandler: handler, source: '<mml></mml>' },
    });

    expect(handler).toHaveBeenCalledTimes(0);
    act(() => {
      fireEvent.submit(screen.getByTestId('mml-form'));
    });

    await waitFor(() => {
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({});
    });
  });

  it('actionHandler should be called with data', async () => {
    const handler = jest.fn();
    await renderComponent({
      mmlProps: {
        actionHandler: handler,
        source: "<mml name='mml_number'><number name='no' value='100'/></mml>",
      },
    });

    expect(handler).toHaveBeenCalledTimes(0);
    act(() => {
      fireEvent.submit(screen.getByTestId('mml-form'));
    });

    await waitFor(() => {
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({
        mml_name: 'mml_number',
        no: '100',
      });
    });
  });
});
