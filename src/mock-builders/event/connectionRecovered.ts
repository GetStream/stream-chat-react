import type { StreamChat } from 'stream-chat';

export default (client: StreamChat) => {
  client.dispatchEvent({
    type: 'connection.recovered',
  } as any);
};
