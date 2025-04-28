import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageInput } from '../MessageInput';
import { Chat } from '../../Chat';
import {
  ChannelActionProvider,
  ChannelStateProvider,
  ComponentProvider,
  TranslationProvider,
} from '../../../context';
import { initClientWithChannels } from '../../../mock-builders';
import { CHANNEL_CONTAINER_ID } from '../../Channel/constants';
import { AttachmentSelector } from '../AttachmentSelector';

const ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID = 'attachment-selector-actions-menu';
const POLL_CREATION_DIALOG_TEST_ID = 'poll-creation-dialog';

const ATTACHMENT_SELECTOR_CLASS = 'str-chat__attachment-selector';
const UPLOAD_FILE_BUTTON_CLASS =
  'str-chat__attachment-selector-actions-menu__upload-file-button';
const CREATE_POLL_BUTTON_CLASS =
  'str-chat__attachment-selector-actions-menu__create-poll-button';

const translationContext = {
  t: (v) => v,
};

const defaultChannelStateContext = {
  channelCapabilities: { 'send-poll': true, 'upload-file': true },
  channelConfig: { polls: true },
};

const defaultMessageInputProps = {
  isThreadInput: false,
};

const invokeMenu = async () => {
  await act(async () => {
    await fireEvent.click(screen.getByTestId('invoke-attachment-selector-button'));
  });
};

const renderComponent = async ({
  channelStateContext,
  componentContext,
  messageInputProps,
} = {}) => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels({
    channelsData: [{ channel: { own_capabilities: ['upload-file'] } }],
  });
  let result;
  await act(() => {
    result = render(
      <Chat client={client}>
        <ComponentProvider value={{ ...componentContext }}>
          <TranslationProvider value={translationContext}>
            <ChannelActionProvider value={{ addNotification: jest.fn() }}>
              <ChannelStateProvider
                value={{ ...defaultChannelStateContext, channel, ...channelStateContext }}
              >
                <div id={CHANNEL_CONTAINER_ID}>
                  <MessageInput
                    {...{ ...defaultMessageInputProps, ...messageInputProps }}
                  />
                </div>
              </ChannelStateProvider>
            </ChannelActionProvider>
          </TranslationProvider>
        </ComponentProvider>
      </Chat>,
    );
  });
  return result;
};

describe('AttachmentSelector', () => {
  it('renders with upload file button and poll button if send-poll and upload-file permissions are granted', async () => {
    await renderComponent();
    await invokeMenu();
    const menu = screen.getByTestId(ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID);
    expect(menu).toBeInTheDocument();
    expect(menu).toHaveTextContent('File');
    expect(menu).toHaveTextContent('Poll');
  });

  it('falls back to SimpleAttachmentSelector if channel.config.polls is false', async () => {
    const { container } = await renderComponent({
      channelStateContext: { channelConfig: { polls: false } },
    });
    expect(
      container.querySelector(`.${ATTACHMENT_SELECTOR_CLASS}`),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('file-upload-button')).toBeInTheDocument();
  });

  it('renders SimpleAttachmentSelector if send-poll permission is not granted', async () => {
    const { container } = await renderComponent({
      channelStateContext: { channelCapabilities: { 'upload-file': true } },
    });
    expect(
      container.querySelector(`.${ATTACHMENT_SELECTOR_CLASS}`),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('file-upload-button')).toBeInTheDocument();
  });

  it('renders SimpleAttachmentSelector if rendered in a thread', async () => {
    const { container } = await renderComponent({
      messageInputProps: { isThreadInput: true },
    });
    expect(
      container.querySelector(`.${ATTACHMENT_SELECTOR_CLASS}`),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('file-upload-button')).toBeInTheDocument();
  });

  it('renders SimpleAttachmentSelector if upload-file permission is not granted', async () => {
    await renderComponent({
      channelStateContext: { channelCapabilities: { 'send-poll': true } },
    });
    await invokeMenu();
    const menu = screen.getByTestId(ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID);
    expect(menu).toBeInTheDocument();
    expect(menu).not.toHaveTextContent('File');
    expect(menu).toHaveTextContent('Poll');
  });

  it('does not render the invoke button if send-poll and upload-file permission is not granted', async () => {
    await renderComponent({
      channelStateContext: { channelCapabilities: {} },
    });
    expect(
      screen.queryByTestId(ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID),
    ).not.toBeInTheDocument();
  });

  it('opens poll creation dialog if Poll option is selected and closes the attachment selector menu', async () => {
    await renderComponent();
    await invokeMenu();
    const menu = screen.getByTestId(ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID);

    const createPollButton = menu.querySelector(`.${CREATE_POLL_BUTTON_CLASS}`);
    expect(createPollButton).toBeInTheDocument();
    fireEvent.click(createPollButton);
    await waitFor(() => {
      expect(menu).not.toBeInTheDocument();
      expect(screen.queryByTestId(POLL_CREATION_DIALOG_TEST_ID)).toBeInTheDocument();
    });
  });

  it('is closed if File menu button is clicked', async () => {
    await renderComponent();
    await invokeMenu();
    const menu = screen.getByTestId(ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID);
    const uploadFileMenuBtn = menu.querySelector(`.${UPLOAD_FILE_BUTTON_CLASS}`);
    expect(uploadFileMenuBtn).toBeInTheDocument();
    await act(async () => {
      await fireEvent.click(uploadFileMenuBtn);
    });
    await waitFor(() => {
      expect(menu).not.toBeInTheDocument();
    });
  });

  it('renders custom menu actions if provided', async () => {
    const customText = 'Custom text';
    const ActionButton = () => <div>{customText}</div>;
    const CustomAttachmentSelector = () => (
      <AttachmentSelector
        attachmentSelectorActionSet={[{ ActionButton, type: 'custom' }]}
      />
    );
    await renderComponent({
      componentContext: { AttachmentSelector: CustomAttachmentSelector },
    });
    await invokeMenu();
    const menu = screen.getByTestId(ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID);
    expect(menu).toBeInTheDocument();
    expect(menu).toHaveTextContent(customText);
    expect(menu).not.toHaveTextContent('File');
    expect(menu).not.toHaveTextContent('Poll');
  });

  it('renders custom modal content if provided', async () => {
    const buttonText = 'Custom text';
    const modalText = 'Modal text';
    const ActionButton = ({ closeMenu, openModalForAction }) => (
      <div
        onClick={() => {
          openModalForAction('custom');
          closeMenu();
        }}
      >
        {buttonText}
      </div>
    );
    const ModalContent = ({ close }) => <div onClick={close}>{modalText}</div>;
    const CustomAttachmentSelector = () => (
      <AttachmentSelector
        attachmentSelectorActionSet={[{ ActionButton, ModalContent, type: 'custom' }]}
      />
    );
    await renderComponent({
      componentContext: { AttachmentSelector: CustomAttachmentSelector },
    });
    await invokeMenu();
    act(() => {
      fireEvent.click(screen.getByText(buttonText));
    });
    await waitFor(() => {
      expect(screen.getByText(modalText)).toBeInTheDocument();
    });

    act(() => {
      fireEvent.click(screen.getByText(modalText));
    });

    await waitFor(() => {
      expect(screen.queryByText(modalText)).not.toBeInTheDocument();
      expect(
        screen.queryByTestId(ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID),
      ).not.toBeInTheDocument();
    });
  });

  it('allows to customize the portal destination', async () => {
    const getModalPortalDestination = jest.fn();
    const CustomAttachmentSelector = () => (
      <AttachmentSelector getModalPortalDestination={getModalPortalDestination} />
    );
    await renderComponent({
      componentContext: { AttachmentSelector: CustomAttachmentSelector },
    });
    await invokeMenu();
    act(() => {
      fireEvent.click(screen.getByText('Poll'));
    });

    await waitFor(() => {
      expect(getModalPortalDestination).toHaveBeenCalledWith();
    });
  });

  it('allows to override PollCreationDialog', async () => {
    const testId = 'custom-poll-creation-dialog';
    const CustomPollCreationDialog = () => <div data-testid={testId} />;
    await renderComponent({
      componentContext: { PollCreationDialog: CustomPollCreationDialog },
    });
    await invokeMenu();
    const menu = screen.getByTestId(ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID);
    const createPollButton = menu.querySelector(`.${CREATE_POLL_BUTTON_CLASS}`);
    act(() => {
      fireEvent.click(createPollButton);
    });
    await waitFor(() => {
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    });
  });
});
