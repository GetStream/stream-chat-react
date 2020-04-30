import { StreamChat } from 'stream-chat';
import { v4 as uuidv4 } from 'uuid';

const apiKey = 'API_KEY';
const apiSecret = 'API_SECRET';

export async function getTestClient(user) {
  const client = new StreamChat(apiKey);

  if (!user) return client;

  const token = 'dummy_token';
  client.connectionId = 'dumm_connection_id';
  client.user = user;
  client._user = { ...user };
  client.userID = user.id;
  client.userToken = token;

  return client;
}

export * from './api';
export * from './event';
export * from './generator';
