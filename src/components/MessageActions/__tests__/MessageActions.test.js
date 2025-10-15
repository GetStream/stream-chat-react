import React from 'react';
import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { MessageActions } from '../MessageActions';
import { MessageActionsBox as MessageActionsBoxMock } from '../MessageActionsBox';

import {
  ChannelStateProvider,
  ChatProvider,
  ComponentProvider,
  DialogManagerProvider,
  MessageProvider,
  TranslationProvider,
} from '../../../context';

import {
  generateMessage,
  getTestClient,
  mockTranslationContext,
} from '../../../mock-builders';

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

function renderMessageActions(customProps = {}) {
  return render(
    <ChatProvider value={{ client: chatClient }}>
      <DialogManagerProvider id='dialog-manager-provider-id'>
        <ChannelStateProvider value={{}}>
          <ComponentProvider value={{}}>
            <TranslationProvider value={mockTranslationContext}>
              <MessageProvider value={{ ...messageContextValue }}>
                <MessageActions {...defaultProps} {...customProps} />
              </MessageProvider>
            </TranslationProvider>
          </ComponentProvider>
        </ChannelStateProvider>
      </DialogManagerProvider>
    </ChatProvider>,
  );
}

const dialogOverlayTestId = 'str-chat__dialog-overlay';
const messageActionsTestId = 'message-actions';

const toggleOpenMessageActions = async () => {
  await act(async () => {
    await fireEvent.click(screen.getByRole('button'));
  });
};
describe('<MessageActions /> component', () => {
  afterEach(cleanup);
  beforeEach(jest.clearAllMocks);

  it('should render correctly when not open', () => {
    const { container } = renderMessageActions();
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="str-chat__message-simple__actions__action str-chat__message-simple__actions__action--options str-chat__message-actions-container"
          data-testid="message-actions"
        >
          <button
            aria-expanded="false"
            aria-haspopup="true"
            aria-label="Open Message Actions Menu"
            class="str-chat__message-actions-box-button"
            data-testid="message-actions-toggle-button"
          >
            <svg
              class="str-chat__message-action-icon"
              height="4"
              viewBox="0 0 11 4"
              width="11"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
                fill-rule="nonzero"
              />
            </svg>
          </button>
        </div>
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

  it('should open message actions box on click', async () => {
    renderMessageActions();
    expect(MessageActionsBoxMock).not.toHaveBeenCalled();
    await act(async () => {
      await toggleOpenMessageActions();
    });
    expect(MessageActionsBoxMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: true }),
      undefined,
    );
    const dialogOverlay = screen.getByTestId(dialogOverlayTestId);
    expect(dialogOverlay.children.length).toBeGreaterThan(0);
  });

  it('should close message actions box on icon click if already opened', async () => {
    renderMessageActions();
    expect(MessageActionsBoxMock).not.toHaveBeenCalled();
    const dialogOverlay = screen.queryByTestId(dialogOverlayTestId);
    expect(dialogOverlay).not.toBeInTheDocument();
    await toggleOpenMessageActions();
    expect(MessageActionsBoxMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: true }),
      undefined,
    );
    await toggleOpenMessageActions();
    await waitFor(() => {
      expect(dialogOverlay).not.toBeInTheDocument();
    });
  });

  it('should close message actions box when user clicks overlay if it is already opened', async () => {
    renderMessageActions();
    await toggleOpenMessageActions();
    expect(MessageActionsBoxMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: true }),
      undefined,
    );
    const dialogOverlay = screen.queryByTestId(dialogOverlayTestId);
    await act(async () => {
      await fireEvent.click(dialogOverlay);
    });
    expect(MessageActionsBoxMock).toHaveBeenCalledTimes(1);
    expect(dialogOverlay).not.toBeInTheDocument();
  });

  it('should close message actions box when user presses Escape key', async () => {
    renderMessageActions();
    await toggleOpenMessageActions();
    await act(async () => {
      await fireEvent.keyUp(document, { charCode: 27, code: 'Escape', key: 'Escape' });
    });
    expect(MessageActionsBoxMock).toHaveBeenCalledTimes(1);
    const dialogOverlay = screen.queryByTestId(dialogOverlayTestId);
    expect(dialogOverlay).not.toBeInTheDocument();
  });

  it('should render the message actions box correctly', async () => {
    renderMessageActions();
    await toggleOpenMessageActions();
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
        open: true,
      }),
      undefined,
    );
  });

  it('should not register click and keyup event listeners to close actions box until opened', async () => {
    renderMessageActions();
    const addEventListener = jest.spyOn(document, 'addEventListener');
    expect(document.addEventListener).not.toHaveBeenCalled();
    await toggleOpenMessageActions();
    expect(document.addEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
    addEventListener.mockClear();
  });

  it('should remove keyup event listener when unmounted if actions box not opened', async () => {
    const { unmount } = renderMessageActions();
    const removeEventListener = jest.spyOn(document, 'removeEventListener');
    expect(document.removeEventListener).not.toHaveBeenCalled();
    await toggleOpenMessageActions();
    unmount();
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'keyup',
      expect.any(Function),
    );
    removeEventListener.mockClear();
  });

  it('should render with a custom wrapper class when one is set', () => {
    const { container } = renderMessageActions({
      customWrapperClass: 'custom-wrapper-class',
    });
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="custom-wrapper-class"
          data-testid="message-actions"
        >
          <button
            aria-expanded="false"
            aria-haspopup="true"
            aria-label="Open Message Actions Menu"
            class="str-chat__message-actions-box-button"
            data-testid="message-actions-toggle-button"
          >
            <svg
              class="str-chat__message-action-icon"
              height="4"
              viewBox="0 0 11 4"
              width="11"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
                fill-rule="nonzero"
              />
            </svg>
          </button>
        </div>
      </div>
    `);
  });

  it('should render with an inline element wrapper when inline set', () => {
    const { container } = renderMessageActions({
      inline: true,
    });
    expect(container).toMatchInlineSnapshot(`
      <div>
        <span
          class="str-chat__message-simple__actions__action str-chat__message-simple__actions__action--options str-chat__message-actions-container"
          data-testid="message-actions"
        >
          <button
            aria-expanded="false"
            aria-haspopup="true"
            aria-label="Open Message Actions Menu"
            class="str-chat__message-actions-box-button"
            data-testid="message-actions-toggle-button"
          >
            <svg
              class="str-chat__message-action-icon"
              height="4"
              viewBox="0 0 11 4"
              width="11"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
                fill-rule="nonzero"
              />
            </svg>
          </button>
        </span>
      </div>
    `);
  });
});
