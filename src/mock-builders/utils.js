import {
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
} from './generator';
import { getOrCreateChannelApi, getTestClientWithUser, useMockedApis } from './index';
import { generateMessageDraft } from './generator/messageDraft';

export async function createClientWithChannel(
  { channelData, empty, existingClient, existingUsers, memberCount, messageCount } = {
    channelData: { image: 'image-xxx', name: 'channel-xxx' },
    empty: false,
    existingClient: null,
    existingUsers: null,
    memberCount: 2,
    messageCount: 20,
  },
) {
  const users = existingUsers || Array.from({ length: memberCount }, generateUser);
  const members = users.map((user) => generateMember({ user }));
  const mockedChannel = generateChannel({
    data: channelData,
    members,
    messages: empty
      ? []
      : ' '
          .repeat(messageCount)
          .split(' ')
          .map((v, i) => generateMessage({ user: users[i % memberCount] })),
  });

  const client = existingClient || (await getTestClientWithUser({ id: users[0].id }));
  useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]); // eslint-disable-line react-hooks/rules-of-hooks
  const channel = client.channel('messaging', mockedChannel.id);
  await channel.watch();

  return { channel, client, users };
}

export const initChannelFromData = async ({
  channelData,
  client,
  defaultGenerateChannelOptions,
}) => {
  const mockedChannelData = generateChannel({
    ...defaultGenerateChannelOptions,
    ...channelData,
  });

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useMockedApis(client, [getOrCreateChannelApi(mockedChannelData)]);
  const channel = client.channel(
    mockedChannelData.channel.type,
    mockedChannelData.channel.id,
  );
  await channel.watch();
  jest
    .spyOn(channel, 'getConfig')
    .mockImplementation(() => mockedChannelData.channel.config);
  jest
    .spyOn(channel, 'getDraft')
    .mockImplementation(() => generateMessageDraft({ channel_cid: channel.cid }));
  return channel;
};

export const initClientWithChannels = async ({ channelsData, customUser } = {}) => {
  const user = customUser || generateUser();
  const client = await getTestClientWithUser(user);
  const defaultGenerateChannelOptions = {
    members: [generateMember({ user })],
  };
  const channels = await Promise.all(
    (channelsData ?? [defaultGenerateChannelOptions]).map((channelData) =>
      initChannelFromData({ channelData, client, defaultGenerateChannelOptions }),
    ),
  );

  return { channels, client };
};
