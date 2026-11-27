import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { ChannelHeader, ChannelHeaderSubtitle } from '../ChannelHeader';

import { Channel } from '../../Channel';
import { Chat } from '../../Chat';
import { ChannelInstanceProvider } from '../../../context';
import { Streami18n } from '../../../i18n';
import { WithComponents } from '../../../context/WithComponents';
import {
  defaultWorkspaceNavigation,
  WorkspaceNavigationProvider,
} from '../../../context/WorkspaceNavigationContext';
import {
  dispatchUserUpdatedEvent,
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  initClientWithChannels,
  useMockedApis,
} from '../../../mock-builders';
import { axe } from '../../../../axe-helper';
import { ChannelAvatar } from '../../Avatar';
import { TypingIndicatorHeader } from '../../TypingIndicator';
import { useChannelHeaderOnlineStatus } from '../hooks/useChannelHeaderOnlineStatus';
import type {
  ChannelAPIResponse,
  ChannelResponse,
  ChannelState,
  Channel as ChannelType,
  StreamChat,
  UserResponse,
} from 'stream-chat';
import type { ComponentContextValue } from '../../../context';
import type { ChannelHeaderProps, ChannelHeaderTitleProps } from '../ChannelHeader';
import type { GenerateChannelOptions } from '../../../mock-builders/generator/channel';

const AVATAR_IMG_TEST_ID = 'avatar-img';

const user1 = generateUser();
const user2 = generateUser({ image: null });
let testChannel1: ChannelAPIResponse;
let client: StreamChat;

const defaultChannelState = {
  members: [generateMember({ user: user1 }), generateMember({ user: user2 })],
};

// Channel custom data is nested: `channel.data.custom.name` and `channel.data.custom.image`, the
// paths the display helpers read.
const channelCustom = (custom: Record<string, unknown>) => ({ custom });

type RenderOptions = {
  channel: ChannelType;
  client: StreamChat;
  componentOverrides?: Partial<ComponentContextValue>;
  props?: ChannelHeaderProps;
};

const headerTree = ({ channel, client, componentOverrides, props }: RenderOptions) => (
  <Chat client={client}>
    <Channel channel={channel}>
      <WithComponents overrides={componentOverrides ?? {}}>
        <ChannelHeader {...props} />
      </WithComponents>
    </Channel>
  </Chat>
);

const renderComponentBase = (options: RenderOptions) => render(headerTree(options));

async function renderComponent({
  channelData,
  channelType = 'messaging',
  props,
  typing,
}: {
  channelData?: Partial<ChannelResponse> & Record<string, unknown>;
  channelType?: string;
  props?: ChannelHeaderProps;
  typing?: ChannelType['state']['typing'];
} = {}) {
  client = await getTestClientWithUser(user1);
  testChannel1 = generateChannel({ ...defaultChannelState, channel: channelData });
  /* eslint-disable-next-line react-hooks/rules-of-hooks */
  useMockedApis(client, [getOrCreateChannelApi(testChannel1)]);
  const channel = client.channel(channelType, testChannel1.channel.id, channelData);
  await channel.query();
  if (typing) channel.state.typing = typing;

  return renderComponentBase({ channel, client, props });
}

// Renders the header for another channel, named `next-channel`, in the same tree, as switching
// channels in one slot does.
const renderNextChannel = async (
  rerender: RenderResult['rerender'],
  props?: ChannelHeaderProps,
) => {
  const nextChannelData = generateChannel({
    ...defaultChannelState,
    channel: channelCustom({ name: 'next-channel' }),
  });
  /* eslint-disable-next-line react-hooks/rules-of-hooks */
  useMockedApis(client, [getOrCreateChannelApi(nextChannelData)]);
  const nextChannel = client.channel('messaging', nextChannelData.channel.id);
  await nextChannel.query();

  rerender(headerTree({ channel: nextChannel, client, props }));
};

afterEach(cleanup);

describe('ChannelHeader', () => {
  it('should render without crashing', async () => {
    const { container } = await renderComponent({
      channelData: channelCustom({ image: 'image.jpg', name: 'test-channel-1' }),
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    expect(container.querySelector('.str-chat__channel-header')).toBeInTheDocument();
  });

  it("should display avatar with fallback image only if other user's name is available", async () => {
    await renderComponent({ channelData: channelCustom({ image: null }) });
    await waitFor(() => {
      expect(screen.queryByTestId('avatar-img')).not.toBeInTheDocument();
      expect(screen.queryByTestId('avatar-fallback')).toBeInTheDocument();
    });
  });

  it('should display avatar when channel has an image', async () => {
    const { container, getByTestId } = await renderComponent({
      channelData: channelCustom({ image: 'image.jpg', name: 'test-channel-1' }),
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    expect(getByTestId('avatar-img')).toBeInTheDocument();
    expect(getByTestId('avatar-img')).toHaveAttribute('src', 'image.jpg');
  });

  it('should display custom title', async () => {
    const { container, getByText } = await renderComponent({
      channelData: channelCustom({ image: 'image.jpg', name: 'test-channel-1' }),
      props: { title: 'Custom Title' },
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    expect(getByText('Custom Title')).toBeInTheDocument();
  });

  it('keeps an empty title passed to it empty', async () => {
    const { container } = await renderComponent({ props: { title: '' } });
    expect(
      container.querySelector('.str-chat__channel-header__data__title'),
    ).toBeEmptyDOMElement();
  });

  it('should render subtitle area for online status', async () => {
    const { container } = await renderComponent({
      channelData: {
        ...channelCustom({ image: 'image.jpg', name: 'test-channel-1' }),
        member_count: 5,
      },
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    const subtitleEl = container.querySelector(
      '.str-chat__channel-header__data__subtitle',
    );
    // The subtitle renders because a member count yields online status text.
    await waitFor(() => {
      expect(subtitleEl).toBeInTheDocument();
    });
  });

  it('should display watcher_count in subtitle', async () => {
    const { container } = await renderComponent({
      channelData: {
        ...channelCustom({ image: 'image.jpg', name: 'test-channel-1' }),
        member_count: 10,
        watcher_count: 34,
      },
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    await waitFor(() => {
      expect(
        container.querySelector('.str-chat__channel-header__data__subtitle'),
      ).toBeInTheDocument();
    });
  });

  it('shows the active member count in the subtitle when the channel has one', async () => {
    await renderComponent({
      channelData: {
        ...channelCustom({ image: 'image.jpg', name: 'test-channel-1' }),
        active_member_count: 8,
        member_count: 10,
      },
    });

    expect(await screen.findByText(/^8 members/)).toBeInTheDocument();
    expect(screen.queryByText(/^10 members/)).not.toBeInTheDocument();
  });

  it('keeps the subtitle and shows zero when the channel has members but none are active', async () => {
    await renderComponent({
      channelData: {
        ...channelCustom({ image: 'image.jpg', name: 'test-channel-1' }),
        active_member_count: 0,
        member_count: 10,
      },
    });

    expect(await screen.findByText(/^0 members/)).toBeInTheDocument();
  });

  it('should display correct member_count in subtitle', async () => {
    const { container } = await renderComponent({
      channelData: {
        ...channelCustom({ image: 'image.jpg', name: 'test-channel-1' }),
        member_count: 34,
      },
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    await waitFor(() => {
      expect(
        container.querySelector('.str-chat__channel-header__data__subtitle'),
      ).toBeInTheDocument();
    });
  });

  describe('typing', () => {
    it('shows the typing indicator while another user types in the channel', async () => {
      await renderComponent({
        typing: { [user2.id]: fromPartial({ type: 'typing.start', user: user2 }) },
      });

      expect(await screen.findByTestId('typing-indicator-header')).toBeInTheDocument();
    });

    it('ignores typing in a thread and by the current user', async () => {
      await renderComponent({
        typing: {
          [user1.id]: fromPartial({ type: 'typing.start', user: user1 }),
          [user2.id]: fromPartial({
            parent_id: 'parent-message',
            type: 'typing.start',
            user: user2,
          }),
        },
      });

      expect(screen.queryByTestId('typing-indicator-header')).not.toBeInTheDocument();
    });

    // The header lingers as long as the message-list `TypingIndicator`, which hides 2s after typing
    // stops.
    describe('after typing stops', () => {
      afterEach(() => {
        vi.useRealTimers();
      });

      it('keeps the typing indicator for the hide delay, then shows the online status', async () => {
        const { container } = await renderComponent({
          channelData: { member_count: 5 },
          typing: { [user2.id]: fromPartial({ type: 'typing.start', user: user2 }) },
        });
        expect(await screen.findByTestId('typing-indicator-header')).toBeInTheDocument();
        const channel = client.channel('messaging', testChannel1.channel.id);
        vi.useFakeTimers();

        act(() => {
          channel.state.typing = {};
        });
        act(() => {
          vi.advanceTimersByTime(1999);
        });
        expect(screen.getByTestId('typing-indicator-header')).toBeInTheDocument();

        act(() => {
          vi.advanceTimersByTime(1);
        });
        expect(screen.queryByTestId('typing-indicator-header')).not.toBeInTheDocument();
        expect(
          container.querySelector('.str-chat__channel-header__data__subtitle'),
        ).toHaveTextContent('5 members · 0 online');
      });

      it('restarts the hide delay when typing stops again', async () => {
        const typingUser2 = {
          [user2.id]: fromPartial<ChannelType['state']['typing'][string]>({
            type: 'typing.start',
            user: user2,
          }),
        };
        await renderComponent({ typing: typingUser2 });
        expect(await screen.findByTestId('typing-indicator-header')).toBeInTheDocument();
        const channel = client.channel('messaging', testChannel1.channel.id);
        vi.useFakeTimers();

        act(() => {
          channel.state.typing = {};
        });
        act(() => {
          vi.advanceTimersByTime(1000);
        });
        act(() => {
          channel.state.typing = typingUser2;
        });
        act(() => {
          vi.advanceTimersByTime(500);
        });
        act(() => {
          channel.state.typing = {};
        });
        // 3s after typing first stopped, but 1.5s after it stopped again.
        act(() => {
          vi.advanceTimersByTime(1500);
        });
        expect(screen.getByTestId('typing-indicator-header')).toBeInTheDocument();

        act(() => {
          vi.advanceTimersByTime(500);
        });
        expect(screen.queryByTestId('typing-indicator-header')).not.toBeInTheDocument();
      });
    });

    it('does not carry typing over into the next channel', async () => {
      const { rerender } = await renderComponent({
        typing: { [user2.id]: fromPartial({ type: 'typing.start', user: user2 }) },
      });
      expect(await screen.findByTestId('typing-indicator-header')).toBeInTheDocument();

      await renderNextChannel(rerender);

      expect(screen.getByText('next-channel')).toBeInTheDocument();
      expect(screen.queryByTestId('typing-indicator-header')).not.toBeInTheDocument();
    });
  });

  describe('StartContent prop', () => {
    const StartContent = () => <div data-testid='sidebar-toggle' />;

    it('should not render StartContent when not provided', async () => {
      await renderComponent();
      expect(screen.queryByTestId('sidebar-toggle')).not.toBeInTheDocument();
    });

    it('should render StartContent when provided', async () => {
      client = await getTestClientWithUser(user1);
      testChannel1 = generateChannel({ ...defaultChannelState });
      useMockedApis(client, [getOrCreateChannelApi(testChannel1)]);
      const channel = client.channel('messaging', testChannel1.channel.id);
      await channel.query();

      renderComponentBase({
        channel,
        client,
        props: { StartContent },
      });

      await waitFor(() =>
        expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument(),
      );
    });
  });

  describe('close button', () => {
    const renderWithNavigation = async (
      navigation: Partial<typeof defaultWorkspaceNavigation>,
      headerProps: ChannelHeaderProps = {},
    ) => {
      client = await getTestClientWithUser(user1);
      testChannel1 = generateChannel({ ...defaultChannelState });
      /* eslint-disable-next-line react-hooks/rules-of-hooks */
      useMockedApis(client, [getOrCreateChannelApi(testChannel1)]);
      const channel = client.channel('messaging', testChannel1.channel.id);
      await channel.query();

      render(
        <Chat client={client}>
          <Channel channel={channel}>
            <WorkspaceNavigationProvider
              value={{ ...defaultWorkspaceNavigation, ...navigation }}
            >
              <ChannelHeader {...headerProps} />
            </WorkspaceNavigationProvider>
          </Channel>
        </Chat>,
      );

      return channel;
    };

    // The back and close buttons are only the defaults: start/end content passed to the header
    // takes their place.
    it('gives way to the StartContent and EndContent passed to it', async () => {
      await renderWithNavigation(
        { canGoBack: () => true, isChannelDismissable: () => true },
        {
          EndContent: () => <div data-testid='app-end' />,
          StartContent: () => <div data-testid='app-start' />,
        },
      );

      expect(await screen.findByTestId('app-start')).toBeInTheDocument();
      expect(screen.getByTestId('app-end')).toBeInTheDocument();
      expect(screen.queryByTestId('channel-header-back-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('close-channel-button')).not.toBeInTheDocument();
    });

    it('is not rendered for a channel that cannot be dismissed', async () => {
      await renderWithNavigation({});
      expect(screen.queryByTestId('close-channel-button')).not.toBeInTheDocument();
    });

    it('is rendered for a dismissable channel and closes it', async () => {
      const closeChannel = vi.fn();
      const isChannelDismissable = vi.fn(() => true);
      const channel = await renderWithNavigation({ closeChannel, isChannelDismissable });

      const button = await screen.findByTestId('close-channel-button');
      // Outside a panel there is none to pass.
      expect(isChannelDismissable).toHaveBeenCalledWith(channel.cid, undefined);
      fireEvent.click(button);
      expect(closeChannel).toHaveBeenCalledWith(channel.cid, expect.anything());
    });

    it('is accompanied by no back button for a channel with nothing beneath it', async () => {
      await renderWithNavigation({ isChannelDismissable: () => true });
      await screen.findByTestId('close-channel-button');
      expect(screen.queryByTestId('channel-header-back-button')).not.toBeInTheDocument();
    });

    it('steps back from a channel stacked over other content', async () => {
      const goBack = vi.fn();
      const channel = await renderWithNavigation({ canGoBack: () => true, goBack });

      fireEvent.click(await screen.findByTestId('channel-header-back-button'));
      expect(goBack).toHaveBeenCalledWith(channel.cid, expect.anything());
    });
  });

  it("DM channel should reflect change of other user's name", async () => {
    const updatedAttribute = { name: 'new-name' };
    await renderComponent();

    await waitFor(() =>
      expect(screen.queryByText(updatedAttribute.name)).not.toBeInTheDocument(),
    );
    act(() => {
      dispatchUserUpdatedEvent(client, { ...user2, ...updatedAttribute });
    });
    await waitFor(() =>
      expect(screen.queryAllByText(updatedAttribute.name).length).toBeGreaterThan(0),
    );
  });

  it("DM channel should reflect change of other user's image", async () => {
    const updatedAttribute = { image: 'new-image' };
    await renderComponent();
    await waitFor(() => {
      expect(screen.queryByTestId('avatar-img')).not.toBeInTheDocument();
      expect(screen.queryByTestId('avatar-fallback')).toBeInTheDocument();
    });
    act(() => {
      dispatchUserUpdatedEvent(client, { ...user2, ...updatedAttribute });
    });
    await waitFor(() =>
      expect(screen.getByTestId('avatar-img')).toHaveAttribute(
        'src',
        updatedAttribute.image,
      ),
    );
  });

  describe('group channel', () => {
    const props = {
      Avatar: ChannelAvatar,
    };

    const getChannelState = (
      memberCount: number,
      channelData?: GenerateChannelOptions,
    ) => {
      const users = Array.from({ length: memberCount }, generateUser);
      const members = users.map((user) => generateMember({ user }));
      return generateChannel({
        members,
        messages: users.map((user) => generateMessage({ user })),
        ...channelData,
      });
    };
    const channelName = 'channel-name';
    const channelState = getChannelState(3, {
      channel: channelCustom({ name: channelName }),
    });

    it('renders group avatar for channels with more than 2 members', async () => {
      const channelState = getChannelState(5);
      const ownUser = channelState.members[0].user;
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelState],
        customUser: ownUser,
      });
      await renderComponentBase({ channel, client, props });
      await waitFor(() => {
        // With more than 4 members (5 here), `GroupAvatar` renders 2 avatars and a "+N" badge.
        const groupAvatar = screen.getByTestId('group-avatar');
        expect(groupAvatar).toBeInTheDocument();
        const avatarImages = screen.getAllByTestId(AVATAR_IMG_TEST_ID);
        expect(avatarImages).toHaveLength(2);
      });
    });

    it.each([
      ['own user', channelState.members[0].user],
      ['other user', channelState.members[2].user],
    ])(
      "should not update the direct messaging channel's preview title if %s's name has changed",
      async (_, user) => {
        const {
          channels: [channel],
          client,
        } = await initClientWithChannels({ channelsData: [channelState] });
        const updatedAttribute = { name: 'new-name' };
        await renderComponentBase({ channel, client, props });

        await waitFor(() => {
          expect(screen.queryByText(updatedAttribute.name)).not.toBeInTheDocument();
          expect(screen.getByText(channelName)).toBeInTheDocument();
        });
        act(() => {
          dispatchUserUpdatedEvent(client, { ...user, ...updatedAttribute });
        });
        await waitFor(() => {
          expect(screen.queryByText(updatedAttribute.name)).not.toBeInTheDocument();
          expect(screen.getByText(channelName)).toBeInTheDocument();
        });
      },
    );

    it("should update the direct messaging channel's preview image if own user's image has changed", async () => {
      const ownUser = channelState.members[0].user;
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelState],
        customUser: ownUser,
      });
      const updatedAttribute = { image: 'new-image' };
      await renderComponentBase({ channel, client, props });
      await waitFor(() => {
        const avatarImages = screen.getAllByTestId(AVATAR_IMG_TEST_ID);
        expect(avatarImages).toHaveLength(3);
        expect(avatarImages[0]).toHaveAttribute('src', ownUser.image);
        expect(avatarImages[1]).toHaveAttribute(
          'src',
          channelState.members[1].user.image,
        );
        expect(avatarImages[2]).toHaveAttribute(
          'src',
          channelState.members[2].user.image,
        );
      });

      act(() => {
        dispatchUserUpdatedEvent(client, { ...ownUser, ...updatedAttribute });
      });

      await waitFor(() => {
        const avatarImages = screen.getAllByTestId(AVATAR_IMG_TEST_ID);
        expect(avatarImages[0]).toHaveAttribute('src', updatedAttribute.image);
        expect(avatarImages[1]).toHaveAttribute(
          'src',
          channelState.members[1].user.image,
        );
        expect(avatarImages[2]).toHaveAttribute(
          'src',
          channelState.members[2].user.image,
        );
      });
    });

    it("should update the direct messaging channel's preview image if other user's image has changed", async () => {
      const ownUser = channelState.members[0].user;
      const otherUser = channelState.members[2].user;
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelState],
        customUser: ownUser,
      });
      const updatedAttribute = { image: 'new-image' };
      await renderComponentBase({ channel, client, props });
      await waitFor(() => {
        const avatarImages = screen.getAllByTestId(AVATAR_IMG_TEST_ID);
        expect(avatarImages).toHaveLength(3);
        expect(avatarImages[0]).toHaveAttribute('src', ownUser.image);
        expect(avatarImages[1]).toHaveAttribute(
          'src',
          channelState.members[1].user.image,
        );
        expect(avatarImages[2]).toHaveAttribute(
          'src',
          channelState.members[2].user.image,
        );
      });

      act(() => {
        dispatchUserUpdatedEvent(client, { ...otherUser, ...updatedAttribute });
      });

      await waitFor(() => {
        const avatarImages = screen.getAllByTestId(AVATAR_IMG_TEST_ID);
        expect(avatarImages[0]).toHaveAttribute('src', ownUser.image);
        expect(avatarImages[1]).toHaveAttribute(
          'src',
          channelState.members[1].user.image,
        );
        expect(avatarImages[2]).toHaveAttribute('src', updatedAttribute.image);
      });
    });

    it("should not update the direct messaging channel's preview if other user's attribute than name or image has changed", async () => {
      const ownUser = channelState.members[0].user;
      const otherUser = channelState.members[2].user;
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelState],
        customUser: ownUser,
      });
      // Arbitrary user attributes live under `user.custom`, which is an object.
      const updatedAttribute = { custom: { someAttribute: 'new-custom' } };
      await renderComponentBase({ channel, client, props });

      await waitFor(() => {
        expect(
          screen.queryByText(updatedAttribute.custom.someAttribute),
        ).not.toBeInTheDocument();
        expect(screen.getByText(channelName)).toBeInTheDocument();
        const avatarImages = screen.getAllByTestId(AVATAR_IMG_TEST_ID);
        avatarImages.forEach((img, i) => {
          expect(img).toHaveAttribute('src', channelState.members[i].user?.image);
        });
      });

      act(() => {
        dispatchUserUpdatedEvent(
          client,
          fromPartial<UserResponse>({ ...otherUser, ...updatedAttribute }),
        );
      });

      await waitFor(() => {
        expect(
          screen.queryByText(updatedAttribute.custom.someAttribute),
        ).not.toBeInTheDocument();
        expect(screen.getByText(channelName)).toBeInTheDocument();
        const avatarImages = screen.getAllByTestId(AVATAR_IMG_TEST_ID);
        avatarImages.forEach((img, i) => {
          expect(img).toHaveAttribute('src', channelState.members[i].user?.image);
        });
      });
    });

    it("should not update the direct messaging channel's preview if own user's attribute than name or image has changed", async () => {
      const ownUser = channelState.members[0].user;
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelState],
        customUser: ownUser,
      });
      // Arbitrary user attributes live under `user.custom`, which is an object.
      const updatedAttribute = { custom: { someAttribute: 'new-custom' } };
      await renderComponentBase({ channel, client, props });

      await waitFor(() => {
        expect(
          screen.queryByText(updatedAttribute.custom.someAttribute),
        ).not.toBeInTheDocument();
        expect(screen.getByText(channelName)).toBeInTheDocument();
        const avatarImages = screen.getAllByTestId(AVATAR_IMG_TEST_ID);
        avatarImages.forEach((img, i) => {
          expect(img).toHaveAttribute('src', channelState.members[i].user?.image);
        });
      });

      act(() => {
        dispatchUserUpdatedEvent(
          client,
          fromPartial<UserResponse>({ ...ownUser, ...updatedAttribute }),
        );
      });

      await waitFor(() => {
        expect(
          screen.queryByText(updatedAttribute.custom.someAttribute),
        ).not.toBeInTheDocument();
        expect(screen.getByText(channelName)).toBeInTheDocument();
        const avatarImages = screen.getAllByTestId(AVATAR_IMG_TEST_ID);
        avatarImages.forEach((img, i) => {
          expect(img).toHaveAttribute('src', channelState.members[i].user?.image);
        });
      });
    });
  });

  describe('Title prop', () => {
    it('renders the display title in the default title element', async () => {
      const { container } = await renderComponent({
        channelData: channelCustom({ name: 'test-channel-1' }),
      });

      await waitFor(() => {
        const titleEl = container.querySelector('.str-chat__channel-header__data__title');
        expect(titleEl?.tagName).toBe('DIV');
        expect(titleEl).toHaveTextContent('test-channel-1');
      });
    });

    it('renders the Title passed to it in place of the default title', async () => {
      const onClick = vi.fn();
      const receivedProps: ChannelHeaderTitleProps[] = [];
      const Title = (titleProps: ChannelHeaderTitleProps) => {
        receivedProps.push(titleProps);
        return (
          <button
            className='str-chat__channel-header__data__title'
            onClick={onClick}
            type='button'
          >
            {titleProps.displayTitle}
          </button>
        );
      };

      const { container } = await renderComponent({
        channelData: { ...channelCustom({ name: 'test-channel-1' }), member_count: 5 },
        props: { Title, title: 'Custom Title' },
      });

      const button = await screen.findByRole('button', { name: 'Custom Title' });
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(receivedProps.at(-1)).toEqual({
        channel: expect.objectContaining({ cid: `messaging:${testChannel1.channel.id}` }),
        displayTitle: 'Custom Title',
      });
      expect(
        container.querySelectorAll('.str-chat__channel-header__data__title'),
      ).toHaveLength(1);
      // The subtitle stays below the replaced title.
      expect(
        container.querySelector('.str-chat__channel-header__data__subtitle'),
      ).toBeInTheDocument();
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('Subtitle prop', () => {
    it('does not carry typing in the Subtitle over into the next channel', async () => {
      const Subtitle = () => <TypingIndicatorHeader />;
      const { rerender } = await renderComponent({
        props: { Subtitle },
        typing: { [user2.id]: fromPartial({ type: 'typing.start', user: user2 }) },
      });
      expect(await screen.findByTestId('typing-indicator-header')).toBeInTheDocument();

      await renderNextChannel(rerender, { Subtitle });

      expect(screen.getByText('next-channel')).toBeInTheDocument();
      expect(screen.queryByTestId('typing-indicator-header')).not.toBeInTheDocument();
    });

    it('renders the Subtitle passed to it in place of the default subtitle', async () => {
      const Subtitle = () => <div data-testid='custom-subtitle'>Custom subtitle</div>;

      const { container } = await renderComponent({
        channelData: { ...channelCustom({ name: 'test-channel-1' }), member_count: 5 },
        props: { Subtitle },
      });

      expect(await screen.findByTestId('custom-subtitle')).toBeInTheDocument();
      expect(
        container.querySelector('.str-chat__channel-header__data__subtitle'),
      ).not.toBeInTheDocument();
      expect(screen.getByText('test-channel-1')).toBeInTheDocument();
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('ChannelHeaderSubtitle', () => {
    // `user1` is the current user. Online means `member.user.online`, not watching the channel.
    const renderSubtitle = async ({
      members = [user1, user2],
      onlineUserIds,
      watchers = [],
    }: {
      members?: UserResponse[];
      onlineUserIds: string[];
      watchers?: UserResponse[];
    }) => {
      client = await getTestClientWithUser(user1);
      testChannel1 = generateChannel({
        channel: { member_count: members.length },
        members: members.map((user) =>
          generateMember({ user: { ...user, online: onlineUserIds.includes(user.id) } }),
        ),
      });
      /* eslint-disable-next-line react-hooks/rules-of-hooks */
      useMockedApis(client, [getOrCreateChannelApi(testChannel1)]);
      const channel = client.channel('messaging', testChannel1.channel.id);
      await channel.query();
      channel.state.watchers = Object.fromEntries(
        watchers.map((user) => [user.id, user]),
      );
      channel.state.watcher_count = watchers.length;

      return render(
        <Chat client={client}>
          <Channel channel={channel}>
            <ChannelHeaderSubtitle />
          </Channel>
        </Chat>,
      );
    };

    it('shows Online for a direct message whose other member is online, watching or not', async () => {
      const { container } = await renderSubtitle({ onlineUserIds: [user1.id, user2.id] });

      expect(await screen.findByText('Online')).toBeInTheDocument();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('shows Offline for a direct message whose other member is offline', async () => {
      const { container } = await renderSubtitle({ onlineUserIds: [user1.id] });

      expect(await screen.findByText('Offline')).toBeInTheDocument();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('shows Online for a direct message whose other member watches it', async () => {
      await renderSubtitle({ onlineUserIds: [user1.id], watchers: [user2] });

      expect(await screen.findByText('Online')).toBeInTheDocument();
    });

    it('counts the members of a group who are online or watch it, not other watchers', async () => {
      const [user3, user4] = [generateUser(), generateUser()];
      const nonMembers = [generateUser(), generateUser()];
      // 4 watchers, of whom 2 are members; online: user1 and user3, and user2 by watching.
      await renderSubtitle({
        members: [user1, user2, user3, user4],
        onlineUserIds: [user1.id, user3.id],
        watchers: [user1, user2, ...nonMembers],
      });

      expect(await screen.findByText('4 members · 3 online')).toBeInTheDocument();
    });
  });
});

/** `count` members, the first `onlineCount` of them online. */
const membersWithOnline = (count: number, onlineCount: number) =>
  Object.fromEntries(
    Array.from({ length: count }, (_, index) => {
      const member = generateMember({
        user: generateUser({ online: index < onlineCount }),
      });
      return [member.user!.id, member];
    }),
  ) as ChannelState['members'];

describe('useChannelHeaderOnlineStatus', () => {
  let client: StreamChat;
  let contextChannel: ChannelType;
  let givenChannel: ChannelType;

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'own-user' });
    contextChannel = client.channel('messaging', 'context');
    contextChannel.data = { member_count: 7 };
    contextChannel.state.members = membersWithOnline(7, 5);
    givenChannel = client.channel('messaging', 'given');
    givenChannel.data = { member_count: 3 };
    givenChannel.state.members = membersWithOnline(3, 2);
  });

  it('reads the channel in context when none is given', () => {
    const { result } = renderHook(() => useChannelHeaderOnlineStatus(), {
      wrapper: ({ children }: React.PropsWithChildren) => (
        <Chat client={client}>
          <ChannelInstanceProvider value={{ channel: contextChannel }}>
            {children}
          </ChannelInstanceProvider>
        </Chat>
      ),
    });

    expect(result.current).toBe('7 members · 5 online');
  });

  it('reads the given channel without a channel provider', () => {
    const { result } = renderHook(
      () => useChannelHeaderOnlineStatus({ channel: givenChannel }),
      {
        wrapper: ({ children }: React.PropsWithChildren) => (
          <Chat client={client}>{children}</Chat>
        ),
      },
    );

    expect(result.current).toBe('3 members · 2 online');
  });

  it('reads the given channel instead of the channel in context', () => {
    const { result } = renderHook(
      () => useChannelHeaderOnlineStatus({ channel: givenChannel }),
      {
        wrapper: ({ children }: React.PropsWithChildren) => (
          <Chat client={client}>
            <ChannelInstanceProvider value={{ channel: contextChannel }}>
              {children}
            </ChannelInstanceProvider>
          </Chat>
        ),
      },
    );

    expect(result.current).toBe('3 members · 2 online');
  });

  it.each(['{{ onlineCount }}', '{{ watcherCount }}'])(
    'renders the online count through a translation that uses %s',
    async (placeholder) => {
      const i18nInstance = new Streami18n({
        translationsForLanguage: {
          'channelHeader.online.online.label': `${placeholder} connected`,
        },
      });
      const { result } = renderHook(
        () => useChannelHeaderOnlineStatus({ channel: givenChannel }),
        {
          wrapper: ({ children }: React.PropsWithChildren) => (
            <Chat client={client} i18nInstance={i18nInstance}>
              {children}
            </Chat>
          ),
        },
      );

      await waitFor(() => expect(result.current).toBe('3 members · 2 connected'));
    },
  );
});
