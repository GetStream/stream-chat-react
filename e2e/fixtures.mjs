/* eslint-env node */
import dotenv from 'dotenv';
import { StreamChat } from 'stream-chat';
dotenv.config();
dotenv.config({ path: `.env.local` });

(async () => {
  const {
    E2E_ADD_MESSAGE_CHANNEL,
    E2E_ADDITIONAL_CHANNELS = '',
    E2E_APP_KEY,
    E2E_APP_SECRET,
    E2E_JUMP_TO_MESSAGE_CHANNEL,
    E2E_LONG_MESSAGE_LISTS_CHANNEL,
    E2E_TEST_USER_1,
    E2E_TEST_USER_2,
  } = process.env;

  async function generateMessages({start, stop, channel, parent_id, quoteMap = {}}) {
    const count = stop - start;
    const messagesToQuote = {};
    const messageResponses = [];
    for (let i = start; i < stop; i++) {
      if (process.stdout.clearLine && process.stdout.cursorTo) {
        printProgress((i - start) / count);
      }
      const indexString = i.toString();
      const messageToQuote = messagesToQuote[indexString];
      const res = await channel.sendMessage({
        attachments: i % 5 === 0 ? [{
          "type": "image",
          "fallback": "brooke-lark--F_5g8EEHYE-unsplash.jpg",
          "image_url": "https://us-east.stream-io-cdn.com/1143119/images/045d9a3a-9af3-4b04-9c75-fc877ec1be02.brooke-lark--F_5g8EEHYE-unsplash.jpg?Key-Pair-Id=APKAIHG36VEWPDULE23Q&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly91cy1lYXN0LnN0cmVhbS1pby1jZG4uY29tLzExNDMxMTkvaW1hZ2VzLzA0NWQ5YTNhLTlhZjMtNGIwNC05Yzc1LWZjODc3ZWMxYmUwMi5icm9va2UtbGFyay0tRl81ZzhFRUhZRS11bnNwbGFzaC5qcGc~Km9oPTU3MTEqb3c9Mzg0MCoiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE2NjM2NzQzODJ9fX1dfQ__&Signature=QzBVaqUI6T9rUoJNjlWnTiZXhMFL-oWGvYz3F16sIrIPRSYnVlllcBjFL6XgGLxKW9PSDKqJUpz-8Wzw1vfhoV07fJQYQc1TWqFc0iGT3fWvVn~JnFnD5TQf3WzfEAg~atKI0gbhCXt~X4Lqw22Kl~L2m5-9CGcynVxHAEnr1Y0K2mN9P8b3AqcZmsKsTUc9q7lwUVyjV6JIcR5yPPwOzcf434vcZCqBikZ-PV-ay8bzq533LL4JrSg9heG78JVzJLx4b8QRmuUnmb47IY32iBhh9qYqrhYNo8xm86PBWJFTJpuQWEH5IpOBBtlCsrj0hEFCljwbwlndmfj7meiotA__&oh=5711&ow=3840",
          "original_width": 3840,
          "original_height": 5711
        }] : [],
        text: `Message ${i}`,
        user: { id: i % 2 ? E2E_TEST_USER_1 : E2E_TEST_USER_2 },
        ...(messageToQuote ? { quoted_message_id: messageToQuote.message.id } : {}),
        ...(parent_id ? { parent_id } : {}),
      });

      if (Object.keys(quoteMap).includes(indexString)) {
        const quotingMessageText = quoteMap[indexString];
        messagesToQuote[quotingMessageText] = res;
      }


      messageResponses.push(res);
    }
    return messageResponses;
  }

  const chat = StreamChat.getInstance(E2E_APP_KEY, E2E_APP_SECRET);

  // Users
  console.log('Creating users...');
  await chat.upsertUsers([{ id: E2E_TEST_USER_1 }, { id: E2E_TEST_USER_2 }]);

  // 'Jump to message' channel
  {
    const MESSAGES_COUNT = 150;
    console.log(`Creating and populating channel '${E2E_JUMP_TO_MESSAGE_CHANNEL}'...`);
    const channel = chat.channel('messaging', E2E_JUMP_TO_MESSAGE_CHANNEL, {
      created_by_id: E2E_TEST_USER_1,
      members: [E2E_TEST_USER_1, E2E_TEST_USER_2],
      name: E2E_JUMP_TO_MESSAGE_CHANNEL,
    });
    await channel.create();
    await channel.truncate();

    await generateMessages({
      channel,
      quoteMap: {'20': '140'},
      start: 0,
      stop: MESSAGES_COUNT
    });

    process.stdout.write('\n');
  }

  // 'navigate-long-message-lists` channel
  {
    console.log(`Creating and populating channel '${E2E_LONG_MESSAGE_LISTS_CHANNEL}'...`);
    const channel = chat.channel('messaging', E2E_LONG_MESSAGE_LISTS_CHANNEL, {
      created_by_id: E2E_TEST_USER_1,
      members: [E2E_TEST_USER_1, E2E_TEST_USER_2],
      name: E2E_LONG_MESSAGE_LISTS_CHANNEL,
    });
    await channel.create();
    await channel.truncate();

    const messages = await generateMessages({
      channel,
      quoteMap: {'99': '149', '137': '148'},
      start:0,
      stop: 150
    });

    await generateMessages({
      channel,
      parent_id:messages.slice(-51)[0].message.id,
      start: 150,
      stop: 300,
    });

    await generateMessages({
      channel,
      parent_id:messages.slice(-26)[0].message.id,
      start: 150,
      stop: 300,
    });

    await generateMessages({
      channel,
      parent_id:messages.slice(-13)[0].message.id,
      start: 150,
      stop: 300,
    });

    await generateMessages({
      channel,
      parent_id:messages.slice(-1)[0].message.id,
      start: 150,
      stop: 300,
    });



    process.stdout.write('\n');
  }

  // 'Add message' channel
  {
    console.log(`Creating channel '${E2E_ADD_MESSAGE_CHANNEL}'...`);
    const channel = chat.channel('messaging', E2E_ADD_MESSAGE_CHANNEL, {
      created_by_id: E2E_TEST_USER_1,
      members: [E2E_TEST_USER_1, E2E_TEST_USER_2],
      name: E2E_ADD_MESSAGE_CHANNEL,
    });
    await channel.create();
    await channel.truncate();
  }

  // Create additional channels from .env
  {
    const additionalChannels = E2E_ADDITIONAL_CHANNELS.replace(/\s+/g, '').split(',');

    for (const additionalChannel of additionalChannels) {
      if (!additionalChannel || !additionalChannel.length) continue;
      console.log(`Creating additional channel '${additionalChannel}'...`);
      const channel = chat.channel('messaging', additionalChannel, {
        created_by_id: E2E_TEST_USER_1,
        members: [E2E_TEST_USER_1, E2E_TEST_USER_2],
        name: additionalChannel,
      });
      await channel.create();
      await channel.truncate();
    }
  }
})().catch((e) => console.error(e));

const printProgress = (progress) => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);

  const BAR_LENGTH = 50;
  const filled = Math.ceil(BAR_LENGTH * progress);
  const empty = BAR_LENGTH - filled;
  process.stdout.write(`[${'#'.repeat(filled)}${' '.repeat(empty)}] ${Math.ceil(progress * 100)}%`);
};
