import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MessageComposer } from '../MessageComposer';
import { Chat } from '../../Chat';
import {
  ChannelActionProvider,
  ChannelStateProvider,
  ComponentProvider,
  MessageProvider,
  TranslationProvider,
  TypingProvider,
} from '../../../context';
import { generateMessage, initClientWithChannels } from '../../../mock-builders';
import { CHANNEL_CONTAINER_ID } from '../../Channel/constants';
import { AttachmentSelector } from '../AttachmentSelector/AttachmentSelector';
import { LegacyThreadContext } from '../../Thread/LegacyThreadContext';
import { ChatViewContext } from '../../ChatView/ChatView';

const ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID = 'attachment-selector-actions-menu';
const POLL_CREATION_DIALOG_TEST_ID = 'poll-creation-dialog';

const UPLOAD_FILE_BUTTON_CLASS =
  'str-chat__attachment-selector-actions-menu__upload-file-button';
const CREATE_POLL_BUTTON_CLASS =
  'str-chat__attachment-selector-actions-menu__create-poll-button';
const SHARE_LOCATION_BUTTON_CLASS =
  'str-chat__attachment-selector-actions-menu__add-location-button';
const SIMPLE_ATTACHMENT_SELECTOR_TEST_ID = 'invoke-attachment-selector-button';
const UPLOAD_INPUT_TEST_ID = 'file-input';

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
  message,
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
  vi.spyOn(channel, 'getDraft').mockImplementation();

  const ThreadOrChannel = () =>
    channelStateContext?.thread ? (
      <LegacyThreadContext.Provider
        value={{
          legacyThread: channelStateContext.thread ?? undefined,
        }}
      >
        <MessageComposer {...messageInputProps} />
      </LegacyThreadContext.Provider>
    ) : (
      <MessageComposer {...messageInputProps} />
    );

  let result;
  await act(() => {
    result = render(
      <ChatViewContext.Provider
        value={{ activeChatView: 'channels', setActiveChatView: vi.fn() }}
      >
        <Chat client={client}>
          <ComponentProvider value={{ ...componentContext }}>
            <TranslationProvider value={translationContext}>
              <TypingProvider value={{}}>
                <ChannelActionProvider value={{}}>
                  <ChannelStateProvider
                    value={{
                      ...defaultChannelStateContext,
                      channel,
                      ...channelStateContext,
                    }}
                  >
                    <div id={CHANNEL_CONTAINER_ID}>
                      {message ? (
                        <MessageProvider value={{ message }}>
                          <ThreadOrChannel />
                        </MessageProvider>
                      ) : (
                        <ThreadOrChannel />
                      )}
                    </div>
                  </ChannelStateProvider>
                </ChannelActionProvider>
              </TypingProvider>
            </TranslationProvider>
          </ComponentProvider>
        </Chat>
      </ChatViewContext.Provider>,
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

  it('renders with poll only if only polls are enabled', async () => {
    const {
      channels: [customChannel],
      client: customClient,
    } = await initClientWithChannels({
      channelsData: [
        {
          channel: {
            ...defaultChannelData,
            cid: 'type:id',
            config: {
              polls: true,
              shared_locations: false,
              uploads: false,
            },
            id: 'id',
            type: 'type',
          },
        },
      ],
    });
    await renderComponent({
      channelStateContext: { channelCapabilities: { 'send-poll': true } },
      customChannel,
      customClient,
    });

    await invokeMenu();
    const menu = screen.getByTestId(ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID);
    expect(menu).toBeInTheDocument();
    expect(menu).not.toHaveTextContent('File');
    expect(menu).toHaveTextContent('Poll');
    expect(menu).not.toHaveTextContent('Location');
  });

  it('does not render with poll only if polls are not enabled and send-poll permission is granted', async () => {
    const {
      channels: [customChannel],
      client: customClient,
    } = await initClientWithChannels({
      channelsData: [
        {
          channel: {
            ...defaultChannelData,
            cid: 'type:id',
            config: {
              commands: [],
              polls: false,
              shared_locations: false,
              uploads: false,
            },
            id: 'id',
            type: 'type',
          },
        },
      ],
    });
    await renderComponent({
      channelStateContext: { channelCapabilities: { 'send-poll': true } },
      customChannel,
      customClient,
    });

    expect(
      screen.queryByTestId('invoke-attachment-selector-button'),
    ).not.toBeInTheDocument();
  });

  it('renders with location only if only shared_locations are enabled', async () => {
    const {
      channels: [customChannel],
      client: customClient,
    } = await initClientWithChannels({
      channelsData: [
        {
          channel: {
            ...defaultChannelData,
            cid: 'type:id',
            config: {
              polls: false,
              shared_locations: true,
              uploads: false,
            },
            id: 'id',
            type: 'type',
          },
        },
      ],
    });
    await renderComponent({
      channelStateContext: { channelCapabilities: {} },
      customChannel,
      customClient,
    });

    await invokeMenu();
    const menu = screen.getByTestId(ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID);
    expect(menu).toBeInTheDocument();
    expect(menu).not.toHaveTextContent('File');
    expect(menu).not.toHaveTextContent('Poll');
    expect(menu).toHaveTextContent('Location');
  });

  it('falls back to SimpleAttachmentSelector if only file uploads are enabled', async () => {
    const {
      channels: [customChannel],
      client: customClient,
    } = await initClientWithChannels({
      channelsData: [
        {
          channel: {
            ...defaultChannelData,
            cid: 'type:id',
            config: {
              commands: [],
              polls: false,
              shared_locations: false,
              uploads: true,
            },
            id: 'id',
            type: 'type',
          },
        },
      ],
    });
    await renderComponent({
      channelStateContext: { channelCapabilities: { 'upload-file': true } },
      customChannel,
      customClient,
    });
    // When only file uploads are enabled, the full context menu is not rendered; only the simple button
    expect(
      screen.queryByTestId('attachment-selector-actions-menu'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId(SIMPLE_ATTACHMENT_SELECTOR_TEST_ID)).toBeInTheDocument();
  });

  it('does not render SimpleAttachmentSelector neither AttachmentSelector menu if upload permission is granted but file upload disabled', async () => {
    const {
      channels: [customChannel],
      client: customClient,
    } = await initClientWithChannels({
      channelsData: [
        {
          channel: {
            ...defaultChannelData,
            cid: 'type:id',
            config: {
              commands: [],
              polls: false,
              shared_locations: false,
              uploads: false,
            },
            id: 'id',
            type: 'type',
          },
        },
      ],
    });
    await renderComponent({
      channelStateContext: { channelCapabilities: { 'upload-file': true } },
      customChannel,
      customClient,
    });

    expect(
      screen.queryByTestId('invoke-attachment-selector-button'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(SIMPLE_ATTACHMENT_SELECTOR_TEST_ID),
    ).not.toBeInTheDocument();
  });

  it('renders SimpleAttachmentSelector if rendered in a thread', async () => {
    const {
      channels: [customChannel],
      client: customClient,
    } = await initClientWithChannels({
      channelsData: [
        {
          channel: {
            ...defaultChannelData,
            cid: 'type:id',
            config: {
              commands: [],
              polls: false,
              shared_locations: false,
              uploads: true,
            },
            id: 'id',
            type: 'type',
          },
        },
      ],
    });
    await renderComponent({
      channelStateContext: {
        channelCapabilities: { 'upload-file': true },
        thread: generateMessage({ cid: customChannel.cid }),
      },
      customChannel,
      customClient,
    });
    // In a thread, the full AttachmentSelector context menu is not used; only the simple button is rendered
    expect(
      screen.queryByTestId('attachment-selector-actions-menu'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId(SIMPLE_ATTACHMENT_SELECTOR_TEST_ID)).toBeInTheDocument();
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
    const ActionButton = ({ openModalForAction }) => (
      <div
        onClick={() => {
          openModalForAction('custom');
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
    });
  });

  it('allows to customize the portal destination', async () => {
    const getModalPortalDestination = vi.fn();
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

const AttachmentSelectorInitiationButtonContents = () => (
  <div data-testid={'customAttachmentSelectorInitiationButtonContents'} />
);
const FileUploadIcon = () => <div data-testid={'customFileUploadIcon'} />;

const getSimpleAttachmentSelectorInvokeElement = () =>
  screen.getByTestId(SIMPLE_ATTACHMENT_SELECTOR_TEST_ID);

describe('SimpleAttachmentSelector', () => {
  const message = generateMessage();
  it('renders the button', async () => {
    await renderComponent({ message });
    expect(screen.getByTestId(SIMPLE_ATTACHMENT_SELECTOR_TEST_ID)).toBeInTheDocument();
  });

  it('does not render if missing "upload-file" capability', async () => {
    await renderComponent({
      channelStateContext: { channelCapabilities: { 'send-poll': true } },
      message,
    });
    expect(
      screen.queryByTestId(SIMPLE_ATTACHMENT_SELECTOR_TEST_ID),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('invoke-attachment-selector-button'),
    ).not.toBeInTheDocument();
  });

  it('opens on Space key up', async () => {
    await renderComponent({ message });
    const inputElement = screen.getByTestId(UPLOAD_INPUT_TEST_ID);
    const inputClickSpy = vi.spyOn(inputElement, 'click').mockReturnValue();
    const label = getSimpleAttachmentSelectorInvokeElement();

    fireEvent.keyUp(label, {
      code: 'Enter',
      key: 'Enter',
    });

    expect(inputClickSpy).toHaveBeenCalled();
  });

  it('opens on Space key up', async () => {
    await renderComponent({ message });
    const inputElement = screen.getByTestId(UPLOAD_INPUT_TEST_ID);
    const inputClickSpy = vi.spyOn(inputElement, 'click').mockReturnValue();
    const label = getSimpleAttachmentSelectorInvokeElement();

    fireEvent.keyUp(label, {
      code: 'Space',
      key: ' ',
    });

    expect(inputClickSpy).toHaveBeenCalled();
  });

  it('does not open on other key up', async () => {
    await renderComponent({ message });
    const inputElement = screen.getByTestId(UPLOAD_INPUT_TEST_ID);
    const inputClickSpy = vi.spyOn(inputElement, 'click').mockReturnValue();
    const label = getSimpleAttachmentSelectorInvokeElement();

    fireEvent.keyUp(label, {
      key: 'A',
    });

    expect(inputClickSpy).not.toHaveBeenCalled();
  });

  it('render custom AttachmentSelectorInitiationButtonContents', async () => {
    await renderComponent({
      componentContext: { AttachmentSelectorInitiationButtonContents },
      message,
    });
    expect(
      screen.getByTestId('customAttachmentSelectorInitiationButtonContents'),
    ).toBeInTheDocument();
  });

  it('does not render FileUploadIcon (deprecated, use AttachmentSelectorInitiationButtonContents)', async () => {
    await renderComponent({
      componentContext: { FileUploadIcon },
      message,
    });
    // FileUploadIcon is no longer used by SimpleAttachmentSelector
    expect(screen.queryByTestId('customFileUploadIcon')).not.toBeInTheDocument();
  });

  it('renders AttachmentSelectorInitiationButtonContents but not FileUploadIcon', async () => {
    await renderComponent({
      componentContext: { AttachmentSelectorInitiationButtonContents, FileUploadIcon },
      message,
    });
    expect(
      screen.getByTestId('customAttachmentSelectorInitiationButtonContents'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('customFileUploadIcon')).not.toBeInTheDocument();
  });
});
