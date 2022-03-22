require('dotenv').config();
const { StreamChat } = require('stream-chat');

(async () => {
  const {
    ADD_MESSAGE_CHANNEL,
    APP_KEY,
    APP_SECRET,
    JUMP_TO_MESSAGE_CHANNEL,
    TEST_USER_1,
    TEST_USER_2,
  } = process.env;
  const chat = StreamChat.getInstance(APP_KEY, APP_SECRET);

  // Users
  console.log('Creating users...');
  await chat.upsertUsers([{ id: TEST_USER_1 }, { id: TEST_USER_2 }]);

  // 'Jump to message' channel
  {
    console.log(`Creating channel '${JUMP_TO_MESSAGE_CHANNEL}'...`);
    const channel = await chat.channel('messaging', JUMP_TO_MESSAGE_CHANNEL, {
      created_by_id: TEST_USER_1,
      members: [TEST_USER_1, TEST_USER_2],
    });
    await channel.create();
    await channel.truncate();
    for (let i = 0, len = 150; i < len; i++) {
      console.log(`Sending message ${i}...`);
      await channel.sendMessage({
        text: `Message ${i}`,
        user: { id: i % 2 ? TEST_USER_1 : TEST_USER_2 },
      });
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  // 'Add message' channel
  {
    console.log(`Creating channel '${ADD_MESSAGE_CHANNEL}'...`);
    const channel = await chat.channel('messaging', ADD_MESSAGE_CHANNEL, {
      created_by_id: TEST_USER_1,
      members: [TEST_USER_1, TEST_USER_2],
    });
    await channel.create();
    await channel.truncate();
  }
})();
