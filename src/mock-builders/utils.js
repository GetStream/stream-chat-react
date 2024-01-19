import { generateChannel, generateMember, generateMessage, generateUser } from './generator';
import { getOrCreateChannelApi, getTestClientWithUser, useMockedApis } from './index';

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

export const initClientWithChannel = async ({ customUser, generateChannelOptions } = {}) => {
  const user = customUser || generateUser();
  const members = [generateMember({ user })];
  const mockedChannel = generateChannel({
    members,
    ...generateChannelOptions,
  });
  const client = await getTestClientWithUser(user);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]);
  const channel = client.channel('messaging', mockedChannel.channel.id);

  jest.spyOn(channel, 'getConfig').mockImplementation(() => mockedChannel.channel.config);
  return { channel, client };
};
