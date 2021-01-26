import React from 'react';
import testRenderer from 'react-test-renderer';
import { act, cleanup, render, fireEvent } from '@testing-library/react';
import { generateMessage } from 'mock-builders';
import { ChannelContext, TranslationContext } from '../../../context';
import MessageActionsBoxMock from '../MessageActionsBox';
import { MessageActions } from '../MessageActions';

jest.mock('../MessageActionsBox', () => jest.fn(() => <div />));

const wrapperMock = document.createElement('div');
jest.spyOn(wrapperMock, 'addEventListener');

const defaultProps = {
  addNotification: () => {},
  message: generateMessage(),
  mutes: [],
  getMessageActions: () => ['flag', 'mute'],
  messageListRect: { x: 0, y: 0, width: 100, height: 100 },
  setEditingState: () => {},
  messageWrapperRef: { current: wrapperMock },
  getMuteUserSuccessNotification: () => 'success',
  getMuteUserErrorNotification: () => 'error',
  getFlagMessageErrorNotification: () => 'error',
  getFlagMessageSuccessNotification: () => 'success',
};
function renderMessageActions(customProps, renderer = render) {
  return renderer(
    <ChannelContext.Provider value={{}}>
      <TranslationContext.Provider value={{ t: (key) => key }}>
        <MessageActions {...defaultProps} {...customProps} />
      </TranslationContext.Provider>
    </ChannelContext.Provider>,
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

  it('should close message actions box when mouse leaves wrapper', () => {
    let onMouseLeave;
    wrapperMock.addEventListener.mockImplementationOnce((_, fn) => {
      onMouseLeave = fn;
    });
    const { getByTestId } = renderMessageActions();
    fireEvent.click(getByTestId(messageActionsTestId));
    expect(wrapperMock.addEventListener).toHaveBeenCalledWith(
      'onMouseLeave',
      expect.any(Function),
    );
    expect(MessageActionsBoxMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: true }),
      {},
    );
    act(() => onMouseLeave());
    expect(MessageActionsBoxMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: false }),
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
        open: false,
        getMessageActions: defaultProps.getMessageActions,
        messageListRect: defaultProps.messageListRect,
        handleFlag: expect.any(Function),
        handleMute: expect.any(Function),
        handlePin: expect.any(Function),
        handleEdit: expect.any(Function),
        handleDelete: expect.any(Function),
        isUserMuted: expect.any(Function),
        mine: false,
      }),
      {},
    );
  });

  it('should remove event listener when unmounted', () => {
    const { unmount } = renderMessageActions();
    const removeEventListener = jest.spyOn(document, 'removeEventListener');
    expect(document.removeEventListener).not.toHaveBeenCalled();
    unmount();
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
    );
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
