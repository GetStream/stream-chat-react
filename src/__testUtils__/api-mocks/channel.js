import regularChannel0 from '../mocked-data/channels/regular-channel-0.json';
import regularChannel1 from '../mocked-data/channels/regular-channel-1.json';
import regularChannel2 from '../mocked-data/channels/regular-channel-2.json';
import regularChannel3 from '../mocked-data/channels/regular-channel-3.json';
import regularChannel4 from '../mocked-data/channels/regular-channel-4.json';
import regularChannel5 from '../mocked-data/channels/regular-channel-5.json';

import u0 from '../mocked-data/users/u0.json';
import u1 from '../mocked-data/users/u1.json';
import u2 from '../mocked-data/users/u2.json';

import regularMessage0 from '../mocked-data/messages/regular-message-0.json';
import regularMessage1 from '../mocked-data/messages/regular-message-1.json';
import regularMessage2 from '../mocked-data/messages/regular-message-2.json';

import { mockedApiResponse } from './utils.js';

export const getMemberObjectForUser = (user) => {
  return {
    user_id: 'u0',
    user,
    is_moderator: false,
    invited: false,
    role: 'member',
  };
};

export const queryChannelsApi = (options = {}) => {
  let channels = [
    regularChannel0,
    regularChannel1,
    regularChannel2,
    regularChannel3,
  ];

  if (options.withChannels && options.withChannels.length > 0) {
    channels = options.withChannels;
  }

  if (options.withMembers && options.withMembers.length > 0) {
    const members = options.withMembers.map((u) => {
      return getMemberObjectForUser(u);
    });
    channels.forEach((c) => {
      c.members = members;
    });
  }

  const result = {
    channels,
    duration: 0.01,
  };

  return mockedApiResponse(result, 'get');
};

export const getOrCreateChannelApi = (options = {}) => {
  let messages = [regularMessage0, regularMessage1, regularMessage2];
  let channel = regularChannel0;
  let members = [];

  if (options.withMessages && options.withMessages.length > 0) {
    messages = options.withMessages;
  }

  if (options.withChannel && options.withChannel.length > 0) {
    channel = options.withChannel;
  }

  if (options.withUsers && options.withUsers.length > 0) {
    members = options.withUsers.map((u) => {
      return getMemberObjectForUser(u);
    });
  }

  const result = {
    channel,
    messages,
    members,
    duration: 0.01,
  };

  return mockedApiResponse(result, 'post');
};
