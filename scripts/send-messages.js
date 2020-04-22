/* eslint-disable */
/* globals process */
import dotenv from 'dotenv';
dotenv.config();
import { StreamChat } from 'stream-chat';

const user = process.env.REACT_APP_CHAT_API_DEFAULT_USER;
const userToken = process.env.REACT_APP_CHAT_API_DEFAULT_USER_TOKEN;
const channelName = 'aww';
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
console.log(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
async function main() {
  const chatClient = new StreamChat(process.env.REACT_APP_CHAT_API_KEY);
  chatClient.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
  chatClient.setUser(
    {
      id: user,
    },
    userToken,
  );
  const channel = chatClient.channel('messaging', channelName, {
    image:
      'https://images.unsplash.com/photo-1512138664757-360e0aad5132?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2851&q=80',
    name: 'The water cooler',
    example: 1,
  });
  await channel.create();
  for (let i = 0; i < 5000; i++) {
    await channel.sendMessage({ text: 'message ' + i });
    await sleep(100);
  }
}
main();
