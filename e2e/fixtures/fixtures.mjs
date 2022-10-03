/* eslint-env node */
import dotenv from 'dotenv';
import { StreamChat } from 'stream-chat';
import { sampleAttachments } from './data/attachment.mjs';
import { generateMessages, setupChannel } from './utils.mjs';

dotenv.config();
dotenv.config({ path: `.env.local` });

(async () => {
  const {
    E2E_ADD_MESSAGE_CHANNEL,
    E2E_ADDITIONAL_CHANNELS = '',
    E2E_APP_KEY,
    E2E_APP_SECRET,
    E2E_JUMP_TO_MESSAGE_CHANNEL,
    E2E_ATTACHMENT_SIZING_CHANNEL,
    E2E_LONG_MESSAGE_LISTS_CHANNEL,
    E2E_TEST_USER_1,
    E2E_TEST_USER_2,
  } = process.env;

  const client = StreamChat.getInstance(E2E_APP_KEY, E2E_APP_SECRET);

  // Users
  console.log('Creating users...');
  await client.upsertUsers([{ id: E2E_TEST_USER_1 }, { id: E2E_TEST_USER_2 }]);

  // 'Jump to message' channel
  {
    const MESSAGES_COUNT = 150;
    const channel = await setupChannel({client, channelName: E2E_JUMP_TO_MESSAGE_CHANNEL})

    await generateMessages({
      channel,
      quoteMap: { '20': '140' },
      start: 0,
      stop: MESSAGES_COUNT,
    });

    process.stdout.write('\n');
  }

  // 'navigate-long-message-lists` channel
  {
    const channel = await setupChannel({client, channelName: E2E_LONG_MESSAGE_LISTS_CHANNEL})

    const messages = await generateMessages({
      channel,
      quoteMap: { 99: '149', 137: '148' },
      start: 0,
      stop: 150,
    });

    await Promise.all([-51, -26, -13, -1].map((offset) => (
      generateMessages({
        channel,
        parent_id: messages.slice(offset)[0].message.id,
        start: 150,
        stop: 300,
      })
    )))

    process.stdout.write('\n');
  }

  // 'Attachment sizing' channel
  {
    const MESSAGES_COUNT = 150;
    const channel = await setupChannel({client, channelName: E2E_ATTACHMENT_SIZING_CHANNEL})

    await generateMessages({
      channel,
      quoteMap: {},
      start: 0,
      stop: MESSAGES_COUNT,
      attachments: sampleAttachments,
    });

    process.stdout.write('\n');
  }

  // 'Add message' channel
  {
    await setupChannel({client, channelName: E2E_ADD_MESSAGE_CHANNEL})
  }

  // Create additional channels from .env
  {
    const additionalChannels = E2E_ADDITIONAL_CHANNELS.replace(/\s+/g, '').split(',');

    for (const additionalChannel of additionalChannels) {
      if (!additionalChannel || !additionalChannel.length) continue;
      await setupChannel({client, channelName: additionalChannel})
    }
  }
})().catch((e) => console.error(e));
