import type { StreamChat } from 'stream-chat';

export default (client: StreamChat, online: boolean) => {
  client.dispatchEvent({
    online,
    type: 'connection.changed',
  } as any);
};
