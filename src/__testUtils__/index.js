import { StreamChat } from 'stream-chat';
import uuidv4 from 'uuid/v4';

const apiKey = 'z58ae7h2xypv';
const apiSecret =
  '4rw3ggqmp3fqxdnw8yja2zq4acpumrfvhjuc99zfdq3jbf84cnxxnfb9zygk479q';

export async function getTestClient(axios) {
  const client = new StreamChat(apiKey, {
    axios,
  });

  const userIdVishal = `vishal-${uuidv4()}`;
  const userTokenVishal = createUserToken(userIdVishal);
  client.connectionId = 'randomConnectionId';
  await client.setUser(
    {
      id: userIdVishal,
      name: 'Vishal',
      status: 'busy',
    },
    userTokenVishal,
  );

  return client;
}

export function createUserToken(userID) {
  const c = new StreamChat(apiKey, apiSecret);
  return c.createToken(userID);
}
