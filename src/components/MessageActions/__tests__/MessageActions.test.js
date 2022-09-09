import React from 'react';
import '@testing-library/jest-dom';
import testRenderer from 'react-test-renderer';
import { cleanup, fireEvent, render } from '@testing-library/react';

import { MessageActions } from '../MessageActions';
import { MessageActionsBox as MessageActionsBoxMock } from '../MessageActionsBox';

import { ChannelStateProvider } from '../../../context/ChannelStateContext';
import { ChatProvider } from '../../../context/ChatContext';
import { MessageProvider } from '../../../context/MessageContext';
import { TranslationProvider } from '../../../context/TranslationContext';

import { generateMessage, getTestClient } from '../../../mock-builders';

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

const chatClient = getTestClient();

function renderMessageActions(customProps, renderer = render) {
  return renderer(
    <ChatProvider value={{ client: chatClient }}>
      <ChannelStateProvider value={{}}>
        <TranslationProvider value={{ t: (key) => key }}>
          <MessageProvider value={{ ...messageContextValue }}>
            <MessageActions {...defaultProps} {...customProps} />
          </MessageProvider>
        </TranslationProvider>
      </ChannelStateProvider>
    </ChatProvider>,
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
        className="
        str-chat__message-simple__actions__action
        str-chat__message-simple__actions__action--options
        str-chat__message-actions-container"
        data-testid="message-actions"
        onClick={[Function]}
      >
        <div />
        <button
          aria-expanded={false}
          aria-haspopup="true"
          aria-label="Open Message Actions Menu"
          className="str-chat__message-actions-box-button"
        >
          <svg
            className="str-chat__message-action-icon"
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
        </button>
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

  it('should close message actions box on icon click if already opened', () => {
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
    fireEvent.click(getByTestId(messageActionsTestId));
    expect(MessageActionsBoxMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: false }),
      {},
    );
  });

  it('should close message actions box when user clicks anywhere in the document if it is already opened', () => {
    const { getByRole } = renderMessageActions();
    fireEvent.click(getByRole('button'));

    expect(MessageActionsBoxMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: true }),
      {},
    );
    fireEvent.click(document);
    expect(MessageActionsBoxMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: false }),
      {},
    );
  });

  it('should close message actions box when user presses Escape key', () => {
    const { getByRole } = renderMessageActions();
    fireEvent.click(getByRole('button'));
    expect(MessageActionsBoxMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: true }),
      {},
    );
    fireEvent.keyUp(document, { charCode: 27, code: 'Escape', key: 'Escape' });
    expect(MessageActionsBoxMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: false }),
      {},
    );
  });

  it('should close actions box open on mouseleave if container ref provided', () => {
    const customProps = {
      messageWrapperRef: { current: wrapperMock },
    };
    const { getByRole } = renderMessageActions(customProps);
    fireEvent.click(getByRole('button'));
    expect(MessageActionsBoxMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: true }),
      {},
    );
    fireEvent.mouseLeave(customProps.messageWrapperRef.current);
    expect(MessageActionsBoxMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: false }),
      {},
    );
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

  it('should not register click and keyup event listeners to close actions box until opened', () => {
    const { getByRole } = renderMessageActions();
    const addEventListener = jest.spyOn(document, 'addEventListener');
    expect(document.addEventListener).not.toHaveBeenCalled();
    fireEvent.click(getByRole('button'));
    expect(document.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(document.addEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
    addEventListener.mockClear();
  });

  it('should not remove click and keyup event listeners when unmounted if actions box not opened', () => {
    const { unmount } = renderMessageActions();
    const removeEventListener = jest.spyOn(document, 'removeEventListener');
    expect(document.removeEventListener).not.toHaveBeenCalled();
    unmount();
    expect(document.removeEventListener).not.toHaveBeenCalledWith('click', expect.any(Function));
    expect(document.removeEventListener).not.toHaveBeenCalledWith('keyup', expect.any(Function));
    removeEventListener.mockClear();
  });

  it('should remove event listener when unmounted', () => {
    const { getByRole, unmount } = renderMessageActions();
    const removeEventListener = jest.spyOn(document, 'removeEventListener');
    fireEvent.click(getByRole('button'));
    expect(document.removeEventListener).not.toHaveBeenCalled();
    unmount();
    expect(document.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(document.removeEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
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
        <button
          aria-expanded={false}
          aria-haspopup="true"
          aria-label="Open Message Actions Menu"
          className="str-chat__message-actions-box-button"
        >
          <svg
            className="str-chat__message-action-icon"
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
        </button>
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
        className="
        str-chat__message-simple__actions__action
        str-chat__message-simple__actions__action--options
        str-chat__message-actions-container"
        data-testid="message-actions"
        onClick={[Function]}
      >
        <div />
        <button
          aria-expanded={false}
          aria-haspopup="true"
          aria-label="Open Message Actions Menu"
          className="str-chat__message-actions-box-button"
        >
          <svg
            className="str-chat__message-action-icon"
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
        </button>
      </span>
    `);
  });
});
