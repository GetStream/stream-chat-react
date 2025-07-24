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
  TypingProvider,
} from '../../../context';
import { generateMessage, initClientWithChannels } from '../../../mock-builders';
import { CHANNEL_CONTAINER_ID } from '../../Channel/constants';
import { AttachmentSelector } from '../AttachmentSelector';
import { LegacyThreadContext } from '../../Thread/LegacyThreadContext';

const ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID = 'attachment-selector-actions-menu';
const POLL_CREATION_DIALOG_TEST_ID = 'poll-creation-dialog';

const ATTACHMENT_SELECTOR_CLASS = 'str-chat__attachment-selector';
const UPLOAD_FILE_BUTTON_CLASS =
  'str-chat__attachment-selector-actions-menu__upload-file-button';
const CREATE_POLL_BUTTON_CLASS =
  'str-chat__attachment-selector-actions-menu__create-poll-button';
const SHARE_LOCATION_BUTTON_CLASS =
  'str-chat__attachment-selector-actions-menu__add-location-button';

const translationContext = {
  t: (v) => v,
  tDateTimeParser: (v) => v.toString(),
};

const defaultChannelData = {
  own_capabilities: ['upload-file'],
};

const defaultConfig = {
  config: { shared_locations: true },
};

const defaultChannelStateContext = {
  channelCapabilities: { 'send-poll': true, 'upload-file': true },
  notifications: [],
};

const invokeMenu = async () => {
  await act(async () => {
    await fireEvent.click(screen.getByTestId('invoke-attachment-selector-button'));
  });
};

const renderComponent = async ({
  channelData = {},
  channelStateContext,
  componentContext,
  customChannel,
  customClient,
  messageInputProps,
} = {}) => {
  let channel, client;
  if (customChannel && customClient) {
    channel = customChannel;
    client = customClient;
  } else {
    const res = await initClientWithChannels({
      channelsData: [
        { channel: { ...defaultChannelData, config: defaultConfig, ...channelData } },
      ],
    });
    channel = res.channels[0];
    client = res.client;
  }
  jest.spyOn(channel, 'getDraft').mockImplementation();
  let result;
  await act(() => {
    result = render(
      <Chat client={client}>
        <ComponentProvider value={{ ...componentContext }}>
          <TranslationProvider value={translationContext}>
            <TypingProvider value={{}}>
              <ChannelActionProvider value={{ addNotification: jest.fn() }}>
                <ChannelStateProvider
                  value={{
                    ...defaultChannelStateContext,
                    channel,
                    ...channelStateContext,
                  }}
                >
                  <div id={CHANNEL_CONTAINER_ID}>
                    {channelStateContext?.thread ? (
                      <LegacyThreadContext.Provider
                        value={{
                          legacyThread: channelStateContext.thread ?? undefined,
                        }}
                      >
                        <MessageInput {...messageInputProps} />
                      </LegacyThreadContext.Provider>
                    ) : (
                      <MessageInput {...messageInputProps} />
                    )}
                  </div>
                </ChannelStateProvider>
              </ChannelActionProvider>
            </TypingProvider>
          </TranslationProvider>
        </ComponentProvider>
      </Chat>,
    );
  });
  return result;
};

describe('AttachmentSelector', () => {
  it('renders with all the buttons if all the permissions are granted', async () => {
    await renderComponent();
    await invokeMenu();
    const menu = screen.getByTestId(ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID);
    expect(menu).toBeInTheDocument();
    expect(menu).toHaveTextContent('File');
    expect(menu).toHaveTextContent('Poll');
    expect(menu).toHaveTextContent('Location');
  });

  it('falls back to SimpleAttachmentSelector if only file uploads are enabled', async () => {
    const {
      channels: [customChannel],
      client: customClient,
    } = await initClientWithChannels();
    customChannel.messageComposer.updateConfig({ location: { enabled: false } });
    const { container } = await renderComponent({
      channelStateContext: { channelCapabilities: { 'upload-file': true } },
      customChannel,
      customClient,
    });
    expect(
      container.querySelector(`.${ATTACHMENT_SELECTOR_CLASS}`),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('file-upload-button')).toBeInTheDocument();
  });

  it('renders SimpleAttachmentSelector if rendered in a thread', async () => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [
        {
          channel: {
            ...defaultChannelData,
            cid: 'type:id',
            config: defaultConfig,
            id: 'id',
            type: 'type',
          },
        },
      ],
    });
    const { container } = await renderComponent({
      channel,
      channelStateContext: { thread: generateMessage({ cid: channel.cid }) },
      client,
    });
    expect(
      container.querySelector(`.${ATTACHMENT_SELECTOR_CLASS}`),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('file-upload-button')).toBeInTheDocument();
  });

  it('renders AttachmentSelector if upload-file permission is not granted', async () => {
    await renderComponent({
      channelStateContext: { channelCapabilities: { 'send-poll': true } },
    });
    await invokeMenu();
    const menu = screen.getByTestId(ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID);
    expect(menu).toBeInTheDocument();
    expect(menu).not.toHaveTextContent('File');
    expect(menu).toHaveTextContent('Poll');
    expect(menu).toHaveTextContent('Location');
  });

  it('renders AttachmentSelector if only location sharing is enabled', async () => {
    await renderComponent({
      channelData: {
        config: { shared_locations: true },
      },
      channelStateContext: { channelCapabilities: {} },
    });
    await invokeMenu();
    const menu = screen.getByTestId(ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID);
    expect(menu).toBeInTheDocument();
    expect(menu).not.toHaveTextContent('File');
    expect(menu).not.toHaveTextContent('Poll');
    expect(menu).toHaveTextContent('Location');
  });

  it('does not render the invoke button if no permissions are not granted', async () => {
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
    expect(menu).not.toHaveTextContent('Location');
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

  it('allows to override ShareLocationDialog', async () => {
    const SHARE_LOCATION_DIALOG_TEST_ID = 'custom-share-location-dialog';
    const CustomShareLocationDialog = () => (
      <div data-testid={SHARE_LOCATION_DIALOG_TEST_ID} />
    );
    await renderComponent({
      componentContext: {
        ShareLocationDialog: CustomShareLocationDialog,
      },
    });
    await invokeMenu();
    const menu = screen.getByTestId(ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID);
    const locationButton = menu.querySelector(`.${SHARE_LOCATION_BUTTON_CLASS}`);
    act(() => {
      fireEvent.click(locationButton);
    });
    await waitFor(() => {
      expect(screen.getByTestId(SHARE_LOCATION_DIALOG_TEST_ID)).toBeInTheDocument();
    });
  });
});
