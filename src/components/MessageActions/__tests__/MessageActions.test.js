import React from 'react';
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
function renderMessageActions(customProps) {
  return render(
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
});
