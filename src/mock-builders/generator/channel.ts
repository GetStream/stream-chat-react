import { nanoid } from 'nanoid';
import type { ChannelAPIResponse, ChannelConfigWithInfo } from 'stream-chat';
import type { DeepPartial } from '../../types/types';

export const generateChannel = (options?: DeepPartial<ChannelAPIResponse>) => {
  const { channel: optionsChannel, ...optionsBesidesChannel } =
    options ?? ({} as ChannelAPIResponse);
  const id = optionsChannel?.id ?? nanoid();
  const type = optionsChannel?.type ?? 'messaging';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { config, id: _, type: __, ...restOptionsChannel } = optionsChannel ?? {};

  return {
    members: [],
    messages: [],
    pinnedMessages: [],
    ...optionsBesidesChannel,

    channel: {
      cid: `${type}:${id}`,

      config: {
        automod: 'disabled',
        automod_behavior: 'flag',
        commands: [
          {
            args: '[text]',
            description: 'Post a random gif to the channel',
            name: 'giphy',
            set: 'fun_set',
          },
        ],
        connect_events: true,
        created_at: '2020-04-24T11:36:43.859020368Z',
        max_message_length: 5000,
        message_retention: 'infinite',
        mutes: true,
        name: 'messaging',
        polls: true,
        reactions: true,
        read_events: true,
        replies: true,
        search: true,
        shared_locations: true,
        typing_events: true,
        updated_at: '2020-04-24T11:36:43.859022903Z',
        uploads: true,
        url_enrichment: true,
        ...config,
      } as ChannelConfigWithInfo,

      created_at: '2020-04-28T11:20:48.578147Z',

      created_by: {
        banned: false,
        created_at: '2020-04-27T13:05:13.847572Z',
        id: 'vishal',
        last_active: '2020-04-28T11:21:08.353026Z',
        online: false,
        role: 'user',
        updated_at: '2020-04-28T11:21:08.357468Z',
      },
      disabled: false,
      frozen: false,
      id,
      type,
      updated_at: '2020-04-28T11:20:48.578147Z',
      ...restOptionsChannel,
    },
  };
};
