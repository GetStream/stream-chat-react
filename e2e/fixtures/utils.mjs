/* eslint-env node */
import dotenv from 'dotenv';

import { sampleAttachments } from './data/attachment.mjs';

dotenv.config();
dotenv.config({ path: `.env.local` });

const { E2E_TEST_USER_1, E2E_TEST_USER_2 } = process.env;

export const setupChannel = async ({
  client,
  channelName,
  created_by_id = E2E_TEST_USER_1,
  members = [E2E_TEST_USER_1, E2E_TEST_USER_2],
}) => {
  console.log(`Creating and populating channel '${channelName}'...`);
  const channel = client.channel('messaging', channelName, {
    created_by_id,
    members,
    name: channelName,
  });
  await channel.create();
  await channel.truncate();

  return channel;
};

export const printProgress = (progress) => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);

  const BAR_LENGTH = 50;
  const filled = Math.ceil(BAR_LENGTH * progress);
  const empty = BAR_LENGTH - filled;
  process.stdout.write(`[${'#'.repeat(filled)}${' '.repeat(empty)}] ${Math.ceil(progress * 100)}%`);
};

export const generateMessages = async ({
  attachments = [],
  channel,
  parent_id,
  processMessageText = (index) => `Message ${index}`,
  quoteMap = {},
  start,
  stop,
}) => {
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
      attachments: attachments[i % sampleAttachments.length] || [],
      text: processMessageText(i),
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
};
