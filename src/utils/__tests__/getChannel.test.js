import { getChannel } from '../getChannel';
import {
  generateChannel,
  generateMember,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../mock-builders';

let client;
const channelData = generateChannel({
  channel: {
    members: [
      generateMember({ user: generateUser() }),
      generateMember({ user: generateUser() }),
    ],
  },
});
const memberIds = channelData.channel.members.map((m) => m.user_id);
describe('getChannel', () => {
  beforeEach(async () => {
    client = await getTestClientWithUser(generateUser());
    useMockedApis(client, [getOrCreateChannelApi(channelData)]);
  });

  afterEach(jest.clearAllMocks);

  it('throws an error if neither channel nor channel type are provided', () =>
    expect(getChannel({ client, id: 'id', members: ['members'] })).rejects.toThrow(
      'Channel or channel type have to be provided to query a channel.',
    ));

  it('throws an error if neither channel with id nor channel members array are provided', async () => {
    const type = 'type';
    await expect(getChannel({ client, type })).rejects.toThrow(
      'Channel ID or channel members array have to be provided to query a channel.',
    );
  });

  it('throws an error if channel without with id and no channel members array are provided', async () => {
    const channel = client.channel('type', undefined);
    await expect(getChannel({ channel, client })).rejects.toThrow(
      'Channel ID or channel members array have to be provided to query a channel.',
    );
  });

  it('throws an error if channel without with id but with channel members array are provided', async () => {
    const channel = client.channel('messaging', { members: memberIds });
    await expect(getChannel({ channel, client })).rejects.toThrow(
      'Channel ID or channel members array have to be provided to query a channel.',
    );
  });

  it('calls channel.watch for a given channel type and id if channel query not already in progress', async () => {
    const channel = client.channel('messaging', channelData.channel.id);
    jest.spyOn(channel, 'watch').mockResolvedValueOnce();
    await getChannel({ client, id: channel.id, type: channel.type });
    expect(channel.watch).toHaveBeenCalledTimes(1);
  });

  it('does not call channel.watch for a given channel type and id if channel query already in progress', () => {
    const channel = client.channel('messaging', channelData.channel.id);
    jest.spyOn(channel, 'watch').mockResolvedValue();
    getChannel({ client, id: channel.id, type: channel.type });
    getChannel({ client, id: channel.id, type: channel.type });
    expect(channel.watch).toHaveBeenCalledTimes(1);
  });

  it('calls channel.watch for a given channel type and members array if channel query not already in progress', async () => {
    const channel = client.channel('messaging', { members: memberIds });
    jest.spyOn(channel, 'watch').mockResolvedValueOnce();
    await getChannel({ client, members: memberIds, type: channelData.channel.type });
    expect(channel.watch).toHaveBeenCalledTimes(1);
  });

  it('does not call channel.watch for a given channel type and members array if channel query already in progress', () => {
    const channel = client.channel('messaging', { members: memberIds });
    jest.spyOn(channel, 'watch').mockResolvedValue();
    getChannel({ client, members: memberIds, type: channelData.channel.type });
    getChannel({ client, members: memberIds, type: channelData.channel.type });
    expect(channel.watch).toHaveBeenCalledTimes(1);
  });

  it('calls channel.watch for a given channel object with id and type if channel query not already in progress', async () => {
    const channel = client.channel('messaging', 'id');
    jest.spyOn(channel, 'watch').mockResolvedValueOnce();
    await getChannel({ channel, client });
    expect(channel.watch).toHaveBeenCalledTimes(1);
  });

  it('does not call channel.watch for a given channel object with id and type if channel query already in progress', () => {
    const channel = client.channel('messaging', 'id');
    jest.spyOn(channel, 'watch').mockResolvedValue();
    getChannel({ channel, client });
    getChannel({ channel, client });
    expect(channel.watch).toHaveBeenCalledTimes(1);
  });

  it('calls channel.watch for a given channel object with type and members array if channel query not already in progress', async () => {
    const channel = client.channel('messaging', undefined);
    jest.spyOn(channel, 'watch').mockResolvedValueOnce();
    await getChannel({ channel, client, members: memberIds });
    expect(channel.watch).toHaveBeenCalledTimes(1);
  });

  it('does not call channel.watch for a given channel object with type and members array if channel query already in progress', () => {
    const channel = client.channel('messaging', undefined);
    jest.spyOn(channel, 'watch').mockResolvedValue();
    getChannel({ channel, client, members: memberIds });
    getChannel({ channel, client, members: memberIds });
    expect(channel.watch).toHaveBeenCalledTimes(1);
  });
});
