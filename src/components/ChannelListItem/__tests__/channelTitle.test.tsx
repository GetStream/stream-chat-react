import React from 'react';
import { cleanup, render, within } from '@testing-library/react';
import type { ChannelResponse, StreamChat, UserResponse } from 'stream-chat';

import { Chat } from '../../Chat';
import { Channel } from '../../Channel';
import { ChannelHeader } from '../../ChannelHeader';
import { ChannelListItem } from '../ChannelListItem';
import { ChannelDetailProvider } from '../../../plugins/ChannelDetail/ChannelDetailContext';
import { ChannelManagementInfoBody } from '../../../plugins/ChannelDetail/Views/ChannelManagementView/ChannelManagementView';
import {
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../../mock-builders';

// The channel list row, the channel header and channel details show a channel with the same title
// and avatar. The avatar prefers an image, then the initials of the channel name or, in a DM, of
// the other member's name; without either it shows the person icon for a DM and the people icon
// for a group. Never the initials of an ID or of a placeholder title.

// No member has a name or an image, so a group avatar has no member tiles to show and the avatar
// depends on the channel and DM rules alone.
const unnamedUser = (id: string) =>
  generateUser({ id, image: undefined, name: undefined }) as UserResponse;
const ownUser = unnamedUser('own-user');

const renderChannel = async ({
  channelData,
  users,
}: {
  channelData?: Partial<ChannelResponse>;
  users: UserResponse[];
}) => {
  const client: StreamChat = await getTestClientWithUser(ownUser);
  const latestSender = users[users.length - 1];
  const channelResponse = generateChannel({
    channel: channelData,
    members: [ownUser, ...users].map((user) => generateMember({ user })),
    // The latest message comes from another member; the avatar must not take its initials.
    messages: [generateMessage({ user: latestSender })],
  });
  /* eslint-disable-next-line react-hooks/rules-of-hooks */
  useMockedApis(client, [getOrCreateChannelApi(channelResponse)]);
  const channel = client.channel('messaging', channelResponse.channel.id);
  await channel.watch();

  const { container } = render(
    <Chat client={client}>
      <div data-testid='list-row'>
        <div aria-label='Channels' role='listbox'>
          <ChannelListItem channel={channel} />
        </div>
      </div>
      <Channel channel={channel}>
        <div data-testid='header'>
          <ChannelHeader />
        </div>
      </Channel>
      <div data-testid='details'>
        <ChannelDetailProvider channel={channel}>
          <ChannelManagementInfoBody actions={[]} />
        </ChannelDetailProvider>
      </div>
    </Chat>,
  );

  const listRow = within(
    container.querySelector('[data-testid="list-row"]') as HTMLElement,
  );
  const header = within(container.querySelector('[data-testid="header"]') as HTMLElement);
  const details = within(
    container.querySelector('[data-testid="details"]') as HTMLElement,
  );

  return {
    container,
    places: {
      details: {
        avatar: details.getByTestId('avatar'),
        title: container.querySelector(
          '.str-chat__channel-detail__channel-management-view__profile__details__title span',
        ) as HTMLElement,
      },
      header: {
        avatar: header.getByTestId('avatar'),
        title: container.querySelector(
          '.str-chat__channel-header__data__title',
        ) as HTMLElement,
      },
      listRow: {
        avatar: listRow.getByTestId('avatar'),
        title: container.querySelector(
          '.str-chat__channel-list-item-data__title span',
        ) as HTMLElement,
      },
    },
  };
};

type Places = Awaited<ReturnType<typeof renderChannel>>['places'];

type ExpectedAvatar =
  | { icon: 'user' | 'users' }
  | { initials: string }
  | { image: string };

const expectEverywhere = (
  places: Places,
  { avatar: expected, title }: { avatar: ExpectedAvatar; title: string },
) => {
  for (const [place, { avatar, title: titleElement }] of Object.entries(places)) {
    expect({ place, title: titleElement.textContent }).toEqual({ place, title });
    const shown = {
      icon: avatar.querySelector('.str-chat__icon--users')
        ? 'users'
        : avatar.querySelector('.str-chat__icon--user')
          ? 'user'
          : undefined,
      image: avatar.querySelector('img')?.getAttribute('src') ?? undefined,
      initials:
        avatar.querySelector('.str-chat__avatar-initials')?.textContent ?? undefined,
    };
    expect({ place, ...shown }).toEqual({
      icon: undefined,
      image: undefined,
      initials: undefined,
      place,
      ...expected,
    });
  }
};

afterEach(cleanup);

describe('channel title and avatar', () => {
  it('shows a named channel by its name and its initials', async () => {
    const { places } = await renderChannel({
      channelData: { custom: { name: 'Design Review' } } as Partial<ChannelResponse>,
      users: [unnamedUser('anne'), unnamedUser('bob')],
    });

    expectEverywhere(places, { avatar: { initials: 'DR' }, title: 'Design Review' });
  });

  it("shows a DM by the other member's name and initials", async () => {
    const { places } = await renderChannel({
      users: [generateUser({ id: 'anne', image: undefined, name: 'Anne Smith' })],
    });

    expectEverywhere(places, { avatar: { initials: 'AS' }, title: 'Anne Smith' });
  });

  it("prefers the other DM member's image", async () => {
    const { places } = await renderChannel({
      users: [generateUser({ id: 'anne', image: 'anne.jpg', name: 'Anne Smith' })],
    });

    expectEverywhere(places, { avatar: { image: 'anne.jpg' }, title: 'Anne Smith' });
  });

  it('shows the person icon for a DM whose other member has no name', async () => {
    const { container, places } = await renderChannel({
      users: [unnamedUser('SmithAnne')],
    });

    expectEverywhere(places, { avatar: { icon: 'user' }, title: 'Direct message' });
    // Not the latest sender's ID.
    expect(container.querySelector('[title="SmithAnne"]')).toBeNull();
  });

  it('shows the people icon and "Unnamed channel" for a group without a name', async () => {
    const { container, places } = await renderChannel({
      users: [unnamedUser('bob'), unnamedUser('SmithAnne')],
    });

    expectEverywhere(places, { avatar: { icon: 'users' }, title: 'Unnamed channel' });
    // Not the latest sender's ID, and no untranslated placeholder.
    expect(container.querySelector('[title="SmithAnne"]')).toBeNull();
    expect(container).not.toHaveTextContent('N/A');
  });
});
