import React from 'react';
import renderer from 'react-test-renderer';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { MML } from '../MML';
import { ChatProvider } from '../../../context/ChatContext';
import { MessageProvider } from '../../../context/MessageContext';

afterEach(cleanup); // eslint-disable-line

const renderComponent = async (
  { chatCtx = {}, messageCtx = {}, mmlProps },
  _renderer = renderer.create,
) => {
  let result;
  await act(() => {
    result = _renderer(
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
    const tree = await renderComponent({ mmlProps: { source: '' } });
    expect(tree.toJSON()).toMatchInlineSnapshot(`
      <div
        className="mml-container  mml-align-right"
        data-testid="mml-container"
      >
        <form
          className="mml-wrap"
          data-testid="mml-form"
          onSubmit={[Function]}
        />
      </div>
    `);
  });

  it('should render a basic mml', async () => {
    const tree = await renderComponent({
      mmlProps: { source: '<mml>Some Text</mml>' },
    });

    expect(tree.toJSON()).toMatchInlineSnapshot(`
      <div
        className="mml-container  mml-align-right"
        data-testid="mml-container"
      >
        <form
          className="mml-wrap"
          data-testid="mml-form"
          onSubmit={[Function]}
        >
          <div
            className="mml-text"
          >
            Some Text
          </div>
        </form>
      </div>
    `);
  });

  it('should render with different align prop', async () => {
    const { rerender } = await renderComponent(
      {
        mmlProps: { align: 'left', source: '<mml></mml>' },
      },
      render,
    );

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
    await renderComponent(
      {
        chatCtx: { theme: 'team dark' },
        mmlProps: { source: '<mml></mml>' },
      },
      render,
    );

    expect(screen.getByTestId('mml-container')).toHaveClass('team-dark');
  });

  it('actionHandler should be called', async () => {
    const handler = jest.fn();
    await renderComponent(
      {
        mmlProps: { actionHandler: handler, source: '<mml></mml>' },
      },
      render,
    );

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
    await renderComponent(
      {
        mmlProps: {
          actionHandler: handler,
          source: "<mml name='mml_number'><number name='no' value='100'/></mml>",
        },
      },
      render,
    );

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
