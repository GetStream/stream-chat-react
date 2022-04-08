/* eslint-env node */
import dotenv from 'dotenv';
import { StreamChat } from 'stream-chat';
dotenv.config();
dotenv.config({ path: `.env.local` });

(async () => {
  const {
    E2E_ADD_MESSAGE_CHANNEL,
    E2E_APP_KEY,
    E2E_APP_SECRET,
    E2E_JUMP_TO_MESSAGE_CHANNEL,
    E2E_TEST_USER_1,
    E2E_TEST_USER_2,
  } = process.env;

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
    });
    await channel.create();
    await channel.truncate();
    let messageToQuote;
    for (let i = 0; i < MESSAGES_COUNT; i++) {
      if (process.stdout.clearLine && process.stdout.cursorTo) {
        printProgress(i / MESSAGES_COUNT);
      }

      const res = await channel.sendMessage({
        text: `Message ${i}`,
        user: { id: i % 2 ? E2E_TEST_USER_1 : E2E_TEST_USER_2 },
        ...(i === 140 ? { quoted_message_id: messageToQuote.message.id } : {}),
      });

      if (i === 20) {
        messageToQuote = res;
      }
    }
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
})();

const printProgress = (progress) => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);

  const BAR_LENGTH = 50;
  const filled = Math.ceil(BAR_LENGTH * progress);
  const empty = BAR_LENGTH - filled;
  process.stdout.write(`[${'#'.repeat(filled)}${' '.repeat(empty)}] ${Math.ceil(progress * 100)}%`);
};
