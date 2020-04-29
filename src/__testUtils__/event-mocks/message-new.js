import regularChannel0 from '../mocked-data/channels/regular-channel-0.json';
import regularChannel1 from '../mocked-data/channels/regular-channel-1.json';
import regularChannel2 from '../mocked-data/channels/regular-channel-2.json';
import regularChannel3 from '../mocked-data/channels/regular-channel-3.json';
import regularChannel4 from '../mocked-data/channels/regular-channel-4.json';
import regularChannel5 from '../mocked-data/channels/regular-channel-5.json';
import u2 from '../mocked-data/users/u2.json';

export default (client, newMessage, channel = {}) => {
  client.dispatchEvent({
    type: 'message.new',
    cid: channel.cid || 'messaging:regular-channel-1',
    message: {
      text: 'hey this is new message',
      type: 'regular',
      user: u2,
      ...newMessage,
    },
    channel: (channel && channel.data) || regularChannel1,
  });
};
