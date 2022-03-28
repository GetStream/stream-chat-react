/* eslint-env node */
import dotenv from 'dotenv';
import { StreamChat } from 'stream-chat';
dotenv.config();
dotenv.config({ path: `.env.local` });

(async () => {
  const {
    ADD_MESSAGE_CHANNEL,
    APP_KEY,
    APP_SECRET,
    JUMP_TO_MESSAGE_CHANNEL,
    TEST_USER_1,
    TEST_USER_2,
  } = Object.entries(process.env).reduce((acc, [key, value]) => {
    acc[key.replace('E2E_', '')] = value;
    return acc;
  }, {});

  const chat = StreamChat.getInstance(APP_KEY, APP_SECRET);

  // Users
  console.log('Creating users...');
  await chat.upsertUsers([{ id: TEST_USER_1 }, { id: TEST_USER_2 }]);

  // 'Jump to message' channel
  {
    console.log(`Creating and populating channel '${JUMP_TO_MESSAGE_CHANNEL}'...`);
    const channel = chat.channel('messaging', JUMP_TO_MESSAGE_CHANNEL, {
      created_by_id: TEST_USER_1,
      members: [TEST_USER_1, TEST_USER_2],
    });
    await channel.create();
    await channel.truncate();
    for (let i = 0, len = 150; i < len; i++) {
      process.stdout.write(`.`);
      await channel.sendMessage({
        text: `Message ${i}`,
        user: { id: i % 2 ? TEST_USER_1 : TEST_USER_2 },
      });
    }
  }

  // 'Add message' channel
  {
    console.log(`Creating channel '${ADD_MESSAGE_CHANNEL}'...`);
    const channel = chat.channel('messaging', ADD_MESSAGE_CHANNEL, {
      created_by_id: TEST_USER_1,
      members: [TEST_USER_1, TEST_USER_2],
      name: ADD_MESSAGE_CHANNEL,
    });
    await channel.create();
    await channel.truncate();
  }
})();
