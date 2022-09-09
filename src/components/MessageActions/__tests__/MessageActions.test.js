import React, { useState } from 'react';
import '@testing-library/jest-dom';
import testRenderer from 'react-test-renderer';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { MessageActions } from '../MessageActions';

import { DEFAULT_MAIN_MSG_LIST_CONTAINER_ID } from '../../../constants/elements';

import { ChannelActionProvider } from '../../../context/ChannelActionContext';
import { ChannelStateProvider } from '../../../context/ChannelStateContext';
import { ChatProvider } from '../../../context/ChatContext';
import { MessageProvider } from '../../../context/MessageContext';
import { TranslationProvider } from '../../../context/TranslationContext';

import { generateMessage, getTestClient } from '../../../mock-builders';

const wrapperMock = document.createElement('div');
jest.spyOn(wrapperMock, 'addEventListener');

const message = generateMessage();

const defaultProps = {
  getMessageActions: () => ['flag', 'mute'],
  handleDelete: () => {},
  handleFlag: () => {},
  handleMute: () => {},
  handlePin: () => {},
  message,
};

const messageContextValue = {
  getMessageActions: () => ['delete', 'edit', 'flag', 'mute', 'pin', 'react', 'reply'],
  handleDelete: () => {},
  handleFlag: () => {},
  handleMute: () => {},
  handlePin: () => {},
  isMyMessage: () => false,
  message,
  messageListContainerId: DEFAULT_MAIN_MSG_LIST_CONTAINER_ID,
  setEditingState: () => {},
};

const chatClient = getTestClient();

const ContenxtProviders = ({ children }) => (
  <ChatProvider value={{ client: chatClient }}>
    <ChannelStateProvider value={{}}>
      <ChannelActionProvider value={{}}>
        <TranslationProvider value={{ t: (key) => key }}>
          <MessageProvider value={{ ...messageContextValue }}>{children}</MessageProvider>
        </TranslationProvider>
      </ChannelActionProvider>
    </ChannelStateProvider>
  </ChatProvider>
);

function renderMessageActions(customProps, renderer = render) {
  return renderer(
    <ContenxtProviders>
      <div id={DEFAULT_MAIN_MSG_LIST_CONTAINER_ID}>
        <MessageActions {...defaultProps} {...customProps} />
      </div>
    </ContenxtProviders>,
  );
}

const messageActionsButtonTestId = 'message-actions-button';
const messageActionsBoxTestId = 'message-actions-box';
const modalOverlayTestId = 'modal-overlay';

const clickActionsButton = () =>
  act(async () => {
    await fireEvent.click(screen.getByTestId(messageActionsButtonTestId));
  });

describe('<MessageActions /> component', () => {
  afterEach(cleanup);
  beforeEach(jest.clearAllMocks);

  it('should render correctly', () => {
    const tree = renderMessageActions({}, testRenderer.create);
    expect(tree.toJSON()).toMatchInlineSnapshot(`
      <div
        id="str-chat__main-list-container"
      >
        <div
          className="
        str-chat__message-simple__actions__action
        str-chat__message-simple__actions__action--options
        str-chat__message-actions-container"
          data-testid="message-actions"
        >
          <button
            aria-expanded={false}
            aria-haspopup="true"
            aria-label="Open Message Actions Menu"
            className="str-chat__message-actions-box-button"
            data-testid="message-actions-button"
            onClick={[Function]}
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
      </div>
    `);
  });

  it('should not return anything if message has no actions available', () => {
    const { queryByTestId } = renderMessageActions({
      getMessageActions: () => [],
    });
    // eslint-disable-next-line jest-dom/prefer-in-document
    expect(queryByTestId(messageActionsButtonTestId)).toBeNull();
  });

  it('should open message actions box on click', async () => {
    renderMessageActions();
    await waitFor(() => {
      expect(screen.queryByTestId(messageActionsBoxTestId)).not.toBeInTheDocument();
    });
    await clickActionsButton();
    await waitFor(() => {
      expect(screen.queryByTestId(messageActionsBoxTestId)).toBeInTheDocument();
    });
  });

  it('should close message actions box on icon click if already opened', async () => {
    renderMessageActions();
    expect(screen.queryByTestId(messageActionsBoxTestId)).not.toBeInTheDocument();
    await clickActionsButton();
    await waitFor(() => {
      expect(screen.queryByTestId(messageActionsBoxTestId)).toBeInTheDocument();
    });
    await act(async () => {
      await fireEvent.click(screen.getByTestId(modalOverlayTestId));
    });
    expect(screen.queryByTestId(messageActionsBoxTestId)).not.toBeInTheDocument();
  });

  it('should not close message actions box when user clicks outside the overlay if it is already opened', async () => {
    renderMessageActions();
    await clickActionsButton();
    await waitFor(() => {
      expect(screen.queryByTestId(messageActionsBoxTestId)).toBeInTheDocument();
    });
    await act(async () => {
      await fireEvent.click(document);
    });
    await waitFor(() => {
      expect(screen.queryByTestId(messageActionsBoxTestId)).toBeInTheDocument();
    });
  });

  it('should close message actions box when user presses Escape key', async () => {
    renderMessageActions();
    await clickActionsButton();
    await waitFor(() => {
      expect(screen.queryByTestId(messageActionsBoxTestId)).toBeInTheDocument();
    });
    await act(async () => {
      await fireEvent.keyDown(document, { charCode: 27, code: 'Escape', key: 'Escape' });
    });
    await waitFor(() => {
      expect(screen.queryByTestId(messageActionsBoxTestId)).not.toBeInTheDocument();
    });
  });

  it('should not close actions box open on mouseleave if container ref provided', async () => {
    const customProps = {
      messageWrapperRef: { current: wrapperMock },
    };
    renderMessageActions(customProps);
    await clickActionsButton();
    await waitFor(() => {
      expect(screen.queryByTestId(messageActionsBoxTestId)).toBeInTheDocument();
    });
    await act(async () => {
      await fireEvent.mouseLeave(customProps.messageWrapperRef.current);
    });
    await waitFor(() => {
      expect(screen.queryByTestId(messageActionsBoxTestId)).toBeInTheDocument();
    });
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
        id="str-chat__main-list-container"
      >
        <div
          className="custom-wrapper-class"
          data-testid="message-actions"
        >
          <button
            aria-expanded={false}
            aria-haspopup="true"
            aria-label="Open Message Actions Menu"
            className="str-chat__message-actions-box-button"
            data-testid="message-actions-button"
            onClick={[Function]}
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
      <div
        id="str-chat__main-list-container"
      >
        <span
          className="
        str-chat__message-simple__actions__action
        str-chat__message-simple__actions__action--options
        str-chat__message-actions-container"
          data-testid="message-actions"
        >
          <button
            aria-expanded={false}
            aria-haspopup="true"
            aria-label="Open Message Actions Menu"
            className="str-chat__message-actions-box-button"
            data-testid="message-actions-button"
            onClick={[Function]}
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
      </div>
    `);
  });

  it('modal is attached to custom container when provided container id', async () => {
    const actionsBoxModalContainerId = 'custom-container-id';
    const { asFragment } = render(
      <ContenxtProviders>
        <div id={actionsBoxModalContainerId} />
        <div id={DEFAULT_MAIN_MSG_LIST_CONTAINER_ID}>
          <MessageActions
            {...defaultProps}
            actionsBoxModalContainerId={actionsBoxModalContainerId}
          />
        </div>
      </ContenxtProviders>,
    );
    await clickActionsButton();
    await waitFor(() => {
      expect(asFragment()).toMatchSnapshot();
    });
  });
  it('modal is attached to custom container when provided container element', async () => {
    const actionsBoxModalContainerId = 'custom-container-id';

    const MessageActionsWrapper = () => {
      const [element, setElement] = useState(null);
      return (
        <>
          <div id={actionsBoxModalContainerId} ref={setElement} />
          <div id={DEFAULT_MAIN_MSG_LIST_CONTAINER_ID}>
            <MessageActions {...defaultProps} actionsBoxModalContainer={element} />
          </div>
        </>
      );
    };

    const { asFragment } = render(
      <ContenxtProviders>
        <MessageActionsWrapper />
      </ContenxtProviders>,
    );
    await clickActionsButton();
    await waitFor(() => {
      expect(asFragment()).toMatchSnapshot();
    });
  });
});
