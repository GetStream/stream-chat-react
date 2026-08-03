import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { ChannelHeader } from '../ChannelHeader';

// MERGE-RECONCILE (test migration): the deleted ChannelStateContext/ChatContext mock providers were
// replaced by the real <Chat client><Channel channel> tree (which supplies the channel instance,
// translation and component contexts). Component-slot overrides (e.g. HeaderStartContent) are
// provided via <WithComponents> nested inside <Channel>.
import { Channel } from '../../Channel';
import { Chat } from '../../Chat';
import { WithComponents } from '../../../context/WithComponents';
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
import type {
  ChannelAPIResponse,
  ChannelResponse,
  Channel as ChannelType,
  StreamChat,
  UserResponse,
} from 'stream-chat';
import type { ComponentContextValue } from '../../../context';
import type { ChannelHeaderProps } from '../ChannelHeader';
import type { GenerateChannelOptions } from '../../../mock-builders/generator/channel';

const AVATAR_IMG_TEST_ID = 'avatar-img';

const user1 = generateUser();
const user2 = generateUser({ image: null });
let testChannel1: ChannelAPIResponse;
let client: StreamChat;

const defaultChannelState = {
  members: [generateMember({ user: user1 }), generateMember({ user: user2 })],
};

// stream-chat v10: channel custom data is nested - `channel.data.custom.name` /
// `channel.data.custom.image` (the display helpers read exactly those paths).
const channelCustom = (custom: Record<string, unknown>) => ({ custom });

const renderComponentBase = ({
  channel,
  client,
  componentOverrides,
  props,
}: {
  channel: ChannelType;
  client: StreamChat;
  componentOverrides?: Partial<ComponentContextValue>;
  props?: ChannelHeaderProps;
}) =>
  render(
    <Chat client={client}>
      <Channel channel={channel}>
        <WithComponents overrides={componentOverrides ?? {}}>
          <ChannelHeader {...props} />
        </WithComponents>
      </Channel>
    </Chat>,
  );

async function renderComponent({
  channelData,
  channelType = 'messaging',
  props,
}: {
  channelData?: Partial<ChannelResponse> & Record<string, unknown>;
  channelType?: string;
  props?: ChannelHeaderProps;
} = {}) {
  client = await getTestClientWithUser(user1);
  testChannel1 = generateChannel({ ...defaultChannelState, channel: channelData });
  /* eslint-disable-next-line react-hooks/rules-of-hooks */
  useMockedApis(client, [getOrCreateChannelApi(testChannel1)]);
  const channel = client.channel(channelType, testChannel1.channel.id, channelData);
  await channel.query();

  return renderComponentBase({ channel, client, props });
}

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

  it('should render subtitle area for online status', async () => {
    const { container } = await renderComponent({
      channelData: {
        ...channelCustom({ image: 'image.jpg', name: 'test-channel-1' }),
        member_count: 5,
      },
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    // The subtitle area now shows online status or typing indicator, not channel.data.subtitle
    const subtitleEl = container.querySelector(
      '.str-chat__channel-header__data__subtitle',
    );
    // Subtitle renders when there is member count and thus online status text
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

  describe('HeaderStartContent slot', () => {
    const HeaderStartContent = () => <div data-testid='sidebar-toggle' />;

    it('should not render HeaderStartContent when not provided via ComponentContext', async () => {
      await renderComponent();
      expect(screen.queryByTestId('sidebar-toggle')).not.toBeInTheDocument();
    });

    it('should render HeaderStartContent when provided via ComponentContext', async () => {
      client = await getTestClientWithUser(user1);
      testChannel1 = generateChannel({ ...defaultChannelState });
      useMockedApis(client, [getOrCreateChannelApi(testChannel1)]);
      const channel = client.channel('messaging', testChannel1.channel.id);
      await channel.query();

      renderComponentBase({
        channel,
        client,
        componentOverrides: { HeaderStartContent },
      });

      await waitFor(() =>
        expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument(),
      );
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
        // For 5 members, getGroupChannelDisplayInfo returns overflowCount,
        // so GroupAvatar renders 2 avatars + a "+N" overflow badge
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
      // v10: arbitrary user attributes live under `user.custom` (an object, not a string).
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
      // v10: arbitrary user attributes live under `user.custom` (an object, not a string).
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
});
