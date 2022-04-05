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

  // Delete channels if exist
  {
    console.log('Deleting existing channels');
    await Promise.allSettled(
      [E2E_ADD_MESSAGE_CHANNEL, E2E_JUMP_TO_MESSAGE_CHANNEL].map((channel) =>
        chat.channel('messaging', channel).delete(),
      ),
    );
  }

  // Users
  console.log('Creating users...');
  await chat.upsertUsers([{ id: E2E_TEST_USER_1 }, { id: E2E_TEST_USER_2 }]);

  // 'Jump to message' channel
  {
    console.log(`Creating and populating channel '${E2E_JUMP_TO_MESSAGE_CHANNEL}'...`);
    const channel = chat.channel('messaging', E2E_JUMP_TO_MESSAGE_CHANNEL, {
      created_by_id: E2E_TEST_USER_1,
      members: [E2E_TEST_USER_1, E2E_TEST_USER_2],
    });
    await channel.create();
    await channel.truncate();
    for (let i = 0, len = 150; i < len; i++) {
      process.stdout.write(`.`);
      await channel.sendMessage({
        text: `Message ${i}`,
        user: { id: i % 2 ? E2E_TEST_USER_1 : E2E_TEST_USER_2 },
      });
    }
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
