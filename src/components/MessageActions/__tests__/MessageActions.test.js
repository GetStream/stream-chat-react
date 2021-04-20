import React from 'react';
import testRenderer from 'react-test-renderer';
import { act, cleanup, fireEvent, render } from '@testing-library/react';

import { MessageActions } from '../MessageActions';
import { MessageActionsBox as MessageActionsBoxMock } from '../MessageActionsBox';

import { ChannelStateProvider } from '../../../context/ChannelStateContext';
import { MessageProvider } from '../../../context/MessageContext';
import { TranslationProvider } from '../../../context/TranslationContext';
import { generateMessage } from '../../../mock-builders';

jest.mock('../MessageActionsBox', () => ({
  MessageActionsBox: jest.fn(() => <div />),
}));

const wrapperMock = document.createElement('div');
jest.spyOn(wrapperMock, 'addEventListener');

const defaultProps = {
  getMessageActions: () => ['flag', 'mute'],
  handleDelete: () => {},
  handleFlag: () => {},
  handleMute: () => {},
  handlePin: () => {},
  message: generateMessage(),
};

const messageContextValue = {
  getMessageActions: () => ['delete', 'edit', 'flag', 'mute', 'pin', 'react', 'reply'],
  handleDelete: () => {},
  handleFlag: () => {},
  handleMute: () => {},
  handlePin: () => {},
  isMyMessage: () => false,
  message: generateMessage(),
  setEditingState: () => {},
};

function renderMessageActions(customProps, renderer = render) {
  return renderer(
    <ChannelStateProvider value={{}}>
      <TranslationProvider value={{ t: (key) => key }}>
        <MessageProvider value={{ ...messageContextValue }}>
          <MessageActions {...defaultProps} {...customProps} />
        </MessageProvider>
      </TranslationProvider>
    </ChannelStateProvider>,
  );
}

const messageActionsTestId = 'message-actions';
describe('<MessageActions /> component', () => {
  afterEach(cleanup);
  beforeEach(jest.clearAllMocks);

  it('should render correctly', () => {
    const tree = renderMessageActions({}, testRenderer.create);
    expect(tree.toJSON()).toMatchInlineSnapshot(`
      <div
        className="str-chat__message-simple__actions__action str-chat__message-simple__actions__action--options"
        data-testid="message-actions"
        onClick={[Function]}
      >
        <div />
        <svg
          height="4"
          viewBox="0 0 11 4"
          width="11"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
            fillRule="nonzero"
          />
        </svg>
      </div>
    `);
  });

  it('should not return anything if message has no actions available', () => {
    const { queryByTestId } = renderMessageActions({
      getMessageActions: () => [],
    });
    // eslint-disable-next-line jest-dom/prefer-in-document
    expect(queryByTestId(messageActionsTestId)).toBeNull();
  });

  it('should open message actions box on click', () => {
    const { getByTestId } = renderMessageActions();
    expect(MessageActionsBoxMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: false }),
      {},
    );
    fireEvent.click(getByTestId(messageActionsTestId));
    expect(MessageActionsBoxMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: true }),
      {},
    );
  });

  it('should close message actions box when user clicks outside the action after it is opened', () => {
    let hideOptions;
    const addEventListenerSpy = jest
      .spyOn(document, 'addEventListener')
      .mockImplementationOnce((_, fn) => {
        hideOptions = fn;
      });
    const { getByTestId } = renderMessageActions();
    fireEvent.click(getByTestId(messageActionsTestId));
    expect(MessageActionsBoxMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: true }),
      {},
    );
    act(() => hideOptions());
    expect(MessageActionsBoxMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: false }),
      {},
    );
    addEventListenerSpy.mockClear();
  });

  it('should render the message actions box correctly', () => {
    renderMessageActions();
    expect(MessageActionsBoxMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        getMessageActions: defaultProps.getMessageActions,
        handleDelete: defaultProps.handleDelete,
        handleEdit: expect.any(Function),
        handleFlag: defaultProps.handleFlag,
        handleMute: defaultProps.handleMute,
        handlePin: defaultProps.handlePin,
        isUserMuted: expect.any(Function),
        mine: false,
        open: false,
      }),
      {},
    );
  });

  it('should remove event listener when unmounted', () => {
    const { unmount } = renderMessageActions();
    const removeEventListener = jest.spyOn(document, 'removeEventListener');
    expect(document.removeEventListener).not.toHaveBeenCalled();
    unmount();
    expect(document.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    removeEventListener.mockClear();
  });

  it('should render with a custom wrapper class when one is set', () => {
    const tree = renderMessageActions(
      {
        customWrapperClass: 'custom-wrapper-class',
      },
      testRenderer.create,
    );
    expect(tree.toJSON()).toMatchInlineSnapshot(`
      <div
        className="custom-wrapper-class"
        data-testid="message-actions"
        onClick={[Function]}
      >
        <div />
        <svg
          height="4"
          viewBox="0 0 11 4"
          width="11"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
            fillRule="nonzero"
          />
        </svg>
      </div>
    `);
  });

  it('should render with an inline element wrapper when inline set', () => {
    const tree = renderMessageActions(
      {
        inline: true,
      },
      testRenderer.create,
    );
    expect(tree.toJSON()).toMatchInlineSnapshot(`
      <span
        className="str-chat__message-simple__actions__action str-chat__message-simple__actions__action--options"
        data-testid="message-actions"
        onClick={[Function]}
      >
        <div />
        <svg
          height="4"
          viewBox="0 0 11 4"
          width="11"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
            fillRule="nonzero"
          />
        </svg>
      </span>
    `);
  });
});
