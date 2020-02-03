import { StreamChat } from 'stream-chat';

const apiKey = 'z58ae7h2xypv';
const apiSecret =
  '4rw3ggqmp3fqxdnw8yja2zq4acpumrfvhjuc99zfdq3jbf84cnxxnfb9zygk479q';

export function getTestClient() {
  return new StreamChat(apiKey);
}

export function createUserToken(userID) {
  const c = new StreamChat(apiKey, apiSecret);
  return c.createToken(userID);
}
