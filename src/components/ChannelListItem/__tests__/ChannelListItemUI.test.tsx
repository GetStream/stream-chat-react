import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { axe } from '../../../../axe-helper';
import {
  generateChannel,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  mockChatContext,
  mockTranslationContextValue,
  useMockedApis,
} from 'mock-builders';

import type { Channel, StreamChat } from 'stream-chat';
import { ChannelListItemUI } from '../ChannelListItemUI';
import type { ChannelListItemUIProps } from '../ChannelListItem';
import {
  ChatProvider,
  type ComponentContextValue,
  ComponentProvider,
  DialogManagerProvider,
  TranslationProvider,
} from '../../../context';

const { announceInteraction } = vi.hoisted(() => ({ announceInteraction: vi.fn() }));

// Keep the rest of the Accessibility barrel real; only stub the announcer so we can assert calls
// (and avoid a missing-provider warning since these tests render the item without a Chat root).
vi.mock('../../Accessibility', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../Accessibility')>()),
  useInteractionAnnouncements: () => ({
    announceInteraction,
    cancelInteraction: vi.fn(),
  }),
}));

const PREVIEW_TEST_ID = 'channel-list-item-button';

// Stub out ChannelListItemActionButtons to avoid needing ChannelListItemContext and DialogManager
const NoopActionButtons = () => null;
NoopActionButtons.getDialogId = () => '';
NoopActionButtons.displayName = 'ChannelListItemActionButtons';

const FocusableActionButtons = () => (
  <div data-testid='channel-list-item-action-buttons'>
    <button data-testid='channel-options-button' type='button'>
      Channel actions
    </button>
  </div>
);
FocusableActionButtons.getDialogId = () => '';
FocusableActionButtons.displayName = 'ChannelListItemActionButtons';

const mockTranslation = (key: string, options?: Record<string, unknown>) => {
  const interpolated = Object.entries(options || {}).reduce(
    (value, [name, arg]) => value.replace(`{{ ${name} }}`, String(arg)),
    key,
  );

  return interpolated.startsWith('aria/')
    ? interpolated.replace('aria/', '')
    : interpolated;
};

describe('ChannelPreviewMessenger', () => {
  const clientUser = generateUser();

  let chatClient: StreamChat;
  let channel: Channel;
  const renderComponent = (
    props?: Partial<ChannelListItemUIProps>,
    componentOverrides: Partial<ComponentContextValue> = {},
  ) => (
    <TranslationProvider value={mockTranslationContextValue({ t: mockTranslation })}>
      <ChatProvider value={mockChatContext({ client: chatClient })}>
        <DialogManagerProvider>
          <ComponentProvider
            value={{
              ChannelListItemActionButtons: NoopActionButtons,
              ...componentOverrides,
            }}
          >
            <div aria-label='Select Channel' role='listbox'>
              <ChannelListItemUI
                channel={channel}
                displayImage='https://randomimage.com/src.jpg'
                displayTitle='Channel name'
                latestMessagePreview='Latest message!'
                setActiveChannel={vi.fn()}
                unread={10}
                {...props}
              />
            </div>
          </ComponentProvider>
        </DialogManagerProvider>
      </ChatProvider>
    </TranslationProvider>
  );

  const initializeChannel = async (c) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMockedApis(chatClient, [getOrCreateChannelApi(c)]);

    channel = chatClient.channel('messaging');

    await channel.watch();
  };

  beforeEach(async () => {
    announceInteraction.mockClear();
    chatClient = await getTestClientWithUser(clientUser);
    await initializeChannel(generateChannel());
  });

  it('should render correctly', () => {
    const { container } = render(renderComponent());
    expect(container).toMatchSnapshot();
  });

  it('composes the row aria-label from name + last message', () => {
    render(renderComponent());
    const button = screen.getByTestId(PREVIEW_TEST_ID);
    const label = button.getAttribute('aria-label') ?? '';
    // Channel display name leads; the label is more than just the name (last message etc.).
    expect(label.startsWith('Channel name')).toBe(true);
    expect(label.length).toBeGreaterThan('Channel name'.length);
  });

  it('sets aria-selected only on the active row (not "false" on every other row)', () => {
    const { rerender } = render(renderComponent({ active: true }));
    expect(screen.getByTestId(PREVIEW_TEST_ID)).toHaveAttribute('aria-selected', 'true');

    rerender(renderComponent({ active: false }));
    expect(screen.getByTestId(PREVIEW_TEST_ID)).not.toHaveAttribute('aria-selected');
  });

  it('announces the active state in the active row aria-label', () => {
    render(renderComponent({ active: true }));
    expect(screen.getByTestId(PREVIEW_TEST_ID).getAttribute('aria-label')).toContain(
      'Active',
    );
  });

  it('lets accessibleLabelConfig override the composed aria-label', () => {
    render(
      renderComponent({
        accessibleLabelConfig: { build: () => 'Custom row label' },
      }),
    );
    expect(screen.getByTestId(PREVIEW_TEST_ID)).toHaveAttribute(
      'aria-label',
      'Custom row label',
    );
  });

  it('should call setActiveChannel on click', async () => {
    const setActiveChannel = vi.fn();
    const { container, getByTestId } = render(
      renderComponent({
        setActiveChannel,
        watchers: {},
      }),
    );

    await waitFor(() => {
      expect(getByTestId(PREVIEW_TEST_ID)).toBeInTheDocument();
    });

    fireEvent.click(getByTestId(PREVIEW_TEST_ID));

    await waitFor(() => {
      expect(setActiveChannel).toHaveBeenCalledTimes(1);
      expect(setActiveChannel).toHaveBeenCalledWith(channel, {});
    });

    const results = await axe(container.firstChild!.firstChild as Element);

    expect(results).toHaveNoViolations();
  });

  it('should render custom class name', () => {
    const className = 'custom-xxx';
    const { container } = render(renderComponent({ className }));
    expect(container.querySelector(`.${className}`)).toBeInTheDocument();
  });

  it('should call custom onSelect function', () => {
    const onSelect = vi.fn();
    render(renderComponent({ onSelect }));
    const previewButton = screen.queryByTestId(PREVIEW_TEST_ID);
    fireEvent.click(previewButton);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('announces the opened channel to assistive tech on selection', () => {
    render(renderComponent({ setActiveChannel: vi.fn() }));
    fireEvent.click(screen.getByTestId(PREVIEW_TEST_ID));
    expect(announceInteraction).toHaveBeenCalledWith('channel.opened', {
      name: 'Channel name',
    });
  });

  it('does not announce when re-selecting the already-active channel', () => {
    render(renderComponent({ active: true, setActiveChannel: vi.fn() }));
    fireEvent.click(screen.getByTestId(PREVIEW_TEST_ID));
    expect(announceInteraction).not.toHaveBeenCalled();
  });

  it('does not announce on a custom onSelect (the custom handler owns its feedback)', () => {
    render(renderComponent({ onSelect: vi.fn() }));
    fireEvent.click(screen.getByTestId(PREVIEW_TEST_ID));
    expect(announceInteraction).not.toHaveBeenCalled();
  });

  it('renders channel actions after the channel item so keyboard users can tab into them', () => {
    render(
      renderComponent(undefined, {
        ChannelListItemActionButtons: FocusableActionButtons,
      }),
    );

    const previewButton = screen.getByTestId(PREVIEW_TEST_ID);
    const actionButton = screen.getByTestId('channel-options-button');
    expect(
      previewButton.compareDocumentPosition(actionButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  describe('pinned', () => {
    it('should not add pinned class or render pin icon when not pinned', () => {
      const { container } = render(renderComponent({ pinned: false }));
      const button = screen.getByTestId(PREVIEW_TEST_ID);
      expect(button).not.toHaveClass('str-chat__channel-list-item--pinned');
      expect(container.querySelector('.str-chat__icon--pin')).not.toBeInTheDocument();
    });

    it('should add pinned class and render pin icon when pinned', () => {
      const { container } = render(renderComponent({ pinned: true }));
      const button = screen.getByTestId(PREVIEW_TEST_ID);
      expect(button).toHaveClass('str-chat__channel-list-item--pinned');
      expect(container.querySelector('.str-chat__icon--pin')).toBeInTheDocument();
    });

    it('should render both pin and mute icons when pinned and muted', () => {
      const { container } = render(renderComponent({ muted: true, pinned: true }));
      const button = screen.getByTestId(PREVIEW_TEST_ID);
      expect(button).toHaveClass('str-chat__channel-list-item--pinned');
      expect(button).toHaveClass('str-chat__channel-list-item--muted');
      expect(container.querySelector('.str-chat__icon--pin')).toBeInTheDocument();
      expect(container.querySelector('.str-chat__icon--mute')).toBeInTheDocument();
    });
  });
});
