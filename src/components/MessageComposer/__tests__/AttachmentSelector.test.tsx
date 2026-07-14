// Import the package barrel first so it evaluates in its natural order (components
// then context). MessageComposer's send/update hooks import `useChannel` from this
// root barrel; importing a deep component path first would trigger a partial circular
// re-entry that leaves `useChannel` undefined under Vitest.
import '../../..';
import React from 'react';
import {
  act,
  fireEvent,
  render,
  type RenderResult,
  screen,
  waitFor,
} from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { CommandResponse } from 'stream-chat';
import { MessageComposer } from '../MessageComposer';
import { Chat } from '../../Chat';
import { Channel } from '../../Channel';
import { MessageProvider, WithComponents } from '../../../context';
import {
  generateMessage,
  initClientWithChannels,
  mockMessageContext,
} from '../../../mock-builders';
import { AttachmentSelector } from '../AttachmentSelector/AttachmentSelector';
import { LegacyThreadContext } from '../../Thread/LegacyThreadContext';

const ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID = 'attachment-selector-actions-menu';
const POLL_CREATION_DIALOG_TEST_ID = 'poll-creation-dialog';

const UPLOAD_FILE_BUTTON_CLASS =
  'str-chat__attachment-selector-actions-menu__upload-file-button';
const CREATE_POLL_BUTTON_CLASS =
  'str-chat__attachment-selector-actions-menu__create-poll-button';
const COMMANDS_BUTTON_CLASS =
  'str-chat__attachment-selector-actions-menu__commands-button';
const SHARE_LOCATION_BUTTON_CLASS =
  'str-chat__attachment-selector-actions-menu__add-location-button';
const SIMPLE_ATTACHMENT_SELECTOR_TEST_ID = 'invoke-attachment-selector-button';
const UPLOAD_INPUT_TEST_ID = 'file-input';

// Capabilities & config now live on the channel (own_capabilities +
// client.configsStore) rather than in a ChannelStateContext. These defaults grant every
// attachment option so the full AttachmentSelector menu renders.
const DEFAULT_OWN_CAPABILITIES = ['upload-file', 'send-poll'];
const DEFAULT_CONFIG = { polls: true, shared_locations: true, uploads: true };

const invokeMenu = async () => {
  await act(async () => {
    await fireEvent.click(screen.getByTestId('invoke-attachment-selector-button'));
  });
};

const renderComponent = async ({
  componentContext,
  config = DEFAULT_CONFIG,
  customChannel,
  customClient,
  message,
  messageInputProps,
  ownCapabilities = DEFAULT_OWN_CAPABILITIES,
  thread,
}: any = {}) => {
  let channel, client;
  if (customChannel && customClient) {
    channel = customChannel;
    client = customClient;
  } else {
    const res = await initClientWithChannels({
      channelsData: [{ channel: { config, own_capabilities: ownCapabilities } }],
    });
    channel = res.channels[0];
    client = res.client;
  }
  vi.spyOn(channel, 'getDraft').mockImplementation(() => {});

  const Composer = () =>
    thread ? (
      <LegacyThreadContext.Provider value={{ legacyThread: thread }}>
        <MessageComposer {...messageInputProps} />
      </LegacyThreadContext.Provider>
    ) : (
      <MessageComposer {...messageInputProps} />
    );

  let result: RenderResult;
  await act(() => {
    result = render(
      <Chat client={client}>
        <WithComponents overrides={{ ...componentContext }}>
          <Channel channel={channel}>
            {message ? (
              <MessageProvider value={mockMessageContext({ message })}>
                <Composer />
              </MessageProvider>
            ) : (
              <Composer />
            )}
          </Channel>
        </WithComponents>
      </Chat>,
    );
  });
  return result;
};

describe('AttachmentSelector', () => {
  it('applies rotate classes to icon content and not to the invoke button', async () => {
    await renderComponent();

    const invokeButton = screen.getByTestId('invoke-attachment-selector-button');

    expect(invokeButton).not.toHaveClass('str-chat__prepare-rotate45');
    expect(invokeButton).not.toHaveClass('str-chat__rotate45');

    const icon = invokeButton.querySelector(
      '.str-chat__attachment-selector__menu-button__icon',
    );
    expect(icon).toHaveClass('str-chat__prepare-rotate45');
    expect(icon).not.toHaveClass('str-chat__rotate45');

    await invokeMenu();

    expect(invokeButton).not.toHaveClass('str-chat__prepare-rotate45');
    expect(invokeButton).not.toHaveClass('str-chat__rotate45');
    expect(icon).toHaveClass('str-chat__prepare-rotate45');
    expect(icon).toHaveClass('str-chat__rotate45');
  });

  it('renders with all the buttons if all the permissions are granted', async () => {
    await renderComponent();
    await invokeMenu();
    const menu = screen.getByTestId(ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID);
    expect(menu).toBeInTheDocument();
    expect(menu).toHaveAttribute('aria-label', 'Attachment Actions');
    expect(menu).toHaveTextContent('File');
    expect(menu).toHaveTextContent('Poll');
    expect(menu).toHaveTextContent('Location');
  });

  it('keeps Commands visible and disables it when all commands are unavailable', async () => {
    const disabledCommand = fromPartial<CommandResponse>({
      args: 'ban-command-args',
      description: 'ban-command-description',
      name: 'ban',
      set: 'moderation_set',
    });
    const {
      channels: [customChannel],
      client: customClient,
    } = await initClientWithChannels({
      channelsData: [
        {
          channel: {
            cid: 'type:id',
            config: {
              commands: [disabledCommand],
              polls: false,
              shared_locations: false,
              uploads: false,
            },
            id: 'id',
            own_capabilities: [],
            type: 'type',
          },
        },
      ],
    });

    customChannel.messageComposer.initState({
      composition: generateMessage({ text: 'editing' }),
    });

    await renderComponent({
      customChannel,
      customClient,
    });

    await invokeMenu();

    const menu = screen.getByTestId(ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID);
    const commandsButton = menu.querySelector(`.${COMMANDS_BUTTON_CLASS}`);

    expect(commandsButton).toBeDisabled();
  });

  it('renders with poll only if only polls are enabled', async () => {
    const {
      channels: [customChannel],
      client: customClient,
    } = await initClientWithChannels({
      channelsData: [
        {
          channel: {
            cid: 'type:id',
            config: {
              polls: true,
              shared_locations: false,
              uploads: false,
            },
            id: 'id',
            own_capabilities: ['send-poll'],
            type: 'type',
          },
        },
      ],
    });
    await renderComponent({
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
            cid: 'type:id',
            config: {
              commands: [],
              polls: false,
              shared_locations: false,
              uploads: false,
            },
            id: 'id',
            own_capabilities: ['send-poll'],
            type: 'type',
          },
        },
      ],
    });
    await renderComponent({
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
            cid: 'type:id',
            config: {
              polls: false,
              shared_locations: true,
              uploads: false,
            },
            id: 'id',
            own_capabilities: [],
            type: 'type',
          },
        },
      ],
    });
    await renderComponent({
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
            cid: 'type:id',
            config: {
              commands: [],
              polls: false,
              shared_locations: false,
              uploads: true,
            },
            id: 'id',
            own_capabilities: ['upload-file'],
            type: 'type',
          },
        },
      ],
    });
    await renderComponent({
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
            cid: 'type:id',
            config: {
              commands: [],
              polls: false,
              shared_locations: false,
              uploads: false,
            },
            id: 'id',
            own_capabilities: ['upload-file'],
            type: 'type',
          },
        },
      ],
    });
    await renderComponent({
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
            cid: 'type:id',
            config: {
              commands: [],
              polls: false,
              shared_locations: false,
              uploads: true,
            },
            id: 'id',
            own_capabilities: ['upload-file'],
            type: 'type',
          },
        },
      ],
    });
    await renderComponent({
      customChannel,
      customClient,
      thread: generateMessage({ cid: customChannel.cid }),
    });
    // In a thread, the full AttachmentSelector context menu is not used; only the simple button is rendered
    expect(
      screen.queryByTestId('attachment-selector-actions-menu'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId(SIMPLE_ATTACHMENT_SELECTOR_TEST_ID)).toBeInTheDocument();
  });

  it('renders AttachmentSelector if upload-file permission is not granted', async () => {
    await renderComponent({
      ownCapabilities: ['send-poll'],
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
      config: { shared_locations: true },
      ownCapabilities: [],
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
      config: {},
      ownCapabilities: [],
    });
    expect(
      screen.queryByTestId(ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID),
    ).not.toBeInTheDocument();
  });

  it('opens poll creation dialog if Poll option is selected and closes the attachment selector menu', async () => {
    await renderComponent();
    const invokeButton = screen.getByTestId('invoke-attachment-selector-button');
    await invokeMenu();
    const menu = screen.getByTestId(ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID);

    const createPollButton = menu.querySelector(`.${CREATE_POLL_BUTTON_CLASS}`);
    expect(createPollButton).toBeInTheDocument();
    fireEvent.click(createPollButton);
    await waitFor(() => {
      expect(menu).not.toBeInTheDocument();
      expect(screen.queryByTestId(POLL_CREATION_DIALOG_TEST_ID)).toBeInTheDocument();
    });

    const dialog = screen.getByRole('dialog', { name: /create poll/i });
    const descriptionId = dialog.getAttribute('aria-describedby');
    expect(descriptionId).toBeTruthy();
    expect(document.getElementById(descriptionId ?? '')).toHaveTextContent(
      'Create a question, add options, and configure poll settings',
    );
    expect(screen.getByPlaceholderText(/Ask a question/i)).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining(descriptionId ?? ''),
    );

    const invokeButtonFocusSpy = vi.spyOn(invokeButton, 'focus');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByTestId(POLL_CREATION_DIALOG_TEST_ID)).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(invokeButtonFocusSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('opens share location dialog with description wired to initial close control', async () => {
    (navigator as any).geolocation = {
      clearWatch: vi.fn(),
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
    };
    await renderComponent();
    const invokeButton = screen.getByTestId('invoke-attachment-selector-button');
    await invokeMenu();
    const menu = screen.getByTestId(ATTACHMENT_SELECTOR__ACTIONS_MENU_TEST_ID);
    const locationButton = menu.querySelector(`.${SHARE_LOCATION_BUTTON_CLASS}`);

    expect(locationButton).toBeInTheDocument();
    fireEvent.click(locationButton);

    await waitFor(() => {
      expect(menu).not.toBeInTheDocument();
      expect(screen.getByTestId('share-location-dialog')).toBeInTheDocument();
    });

    const dialog = screen.getByRole('dialog', { name: /share location/i });
    const descriptionId = dialog.getAttribute('aria-describedby');
    expect(descriptionId).toBeTruthy();
    expect(document.getElementById(descriptionId ?? '')).toHaveTextContent(
      'Select your current location and optionally enable live location sharing',
    );
    const closePromptButton = document.querySelector(
      '.str-chat__prompt__header__close-button',
    ) as HTMLButtonElement | null;
    expect(closePromptButton).toHaveAttribute('aria-describedby', descriptionId);

    const invokeButtonFocusSpy = vi.spyOn(invokeButton, 'focus');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByTestId('share-location-dialog')).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(invokeButtonFocusSpy).toHaveBeenCalledTimes(1);
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
    const ActionButton = ({ openModalForAction }: any) => (
      <div
        onClick={() => {
          openModalForAction('custom');
        }}
      >
        {buttonText}
      </div>
    );
    const ModalContent = ({ close }: any) => <div onClick={close}>{modalText}</div>;
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
  // Only file uploads enabled => AttachmentSelector falls back to SimpleAttachmentSelector.
  const renderSimple = (overrides: Record<string, unknown> = {}) =>
    renderComponent({
      config: { uploads: true },
      message,
      ownCapabilities: ['upload-file'],
      ...overrides,
    });

  it('renders the button', async () => {
    await renderSimple();
    expect(screen.getByTestId(SIMPLE_ATTACHMENT_SELECTOR_TEST_ID)).toBeInTheDocument();
  });

  it('does not render if missing "upload-file" capability', async () => {
    await renderSimple({ ownCapabilities: ['send-poll'] });
    expect(
      screen.queryByTestId(SIMPLE_ATTACHMENT_SELECTOR_TEST_ID),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('invoke-attachment-selector-button'),
    ).not.toBeInTheDocument();
  });

  it('opens on Space key up', async () => {
    await renderSimple();
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
    await renderSimple();
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
    await renderSimple();
    const inputElement = screen.getByTestId(UPLOAD_INPUT_TEST_ID);
    const inputClickSpy = vi.spyOn(inputElement, 'click').mockReturnValue();
    const label = getSimpleAttachmentSelectorInvokeElement();

    fireEvent.keyUp(label, {
      key: 'A',
    });

    expect(inputClickSpy).not.toHaveBeenCalled();
  });

  it('render custom AttachmentSelectorInitiationButtonContents', async () => {
    await renderSimple({
      componentContext: { AttachmentSelectorInitiationButtonContents },
    });
    expect(
      screen.getByTestId('customAttachmentSelectorInitiationButtonContents'),
    ).toBeInTheDocument();
  });

  it('does not render FileUploadIcon (deprecated, use AttachmentSelectorInitiationButtonContents)', async () => {
    await renderSimple({
      componentContext: { FileUploadIcon },
    });
    // FileUploadIcon is no longer used by SimpleAttachmentSelector
    expect(screen.queryByTestId('customFileUploadIcon')).not.toBeInTheDocument();
  });

  it('renders AttachmentSelectorInitiationButtonContents but not FileUploadIcon', async () => {
    await renderSimple({
      componentContext: { AttachmentSelectorInitiationButtonContents, FileUploadIcon },
    });
    expect(
      screen.getByTestId('customAttachmentSelectorInitiationButtonContents'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('customFileUploadIcon')).not.toBeInTheDocument();
  });
});
