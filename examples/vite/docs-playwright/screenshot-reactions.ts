/**
 * Playwright script to capture screenshots for the Reactions cookbook.
 *
 * Captures:
 *   1. Custom reaction options (upvote/downvote) — selector open
 *   2. Segmented reactions list
 *   3. Default clustered reactions list (for comparison)
 *
 * Usage:
 *   npx tsx examples/vite/screenshot-reactions.ts
 *
 * Prerequisites:
 *   - The vite dev server must be running at http://localhost:5175
 */

import { chromium, type BrowserContext, type Page } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5175';
const CHANNEL_ID = `cookbook-reactions-${Date.now()}`;
const USER_A = 'Marco';
const USER_B = 'John';
const OUTPUT_DIR = path.resolve(
  __dirname,
  '../../../docs/data/docs/chat-sdk/react/v14/_assets',
);

// ─── Helpers ──────────────────────────────────────────────────────

async function initSession(
  context: BrowserContext,
  userId: string,
  userName: string,
  createChannel = false,
) {
  const page = await context.newPage();
  const url = `${BASE_URL}/?theme=light&view=chat&user_id=${userId}&user_name=${userName}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.waitForFunction('!!window.client', null, { timeout: 15000 });

  if (createChannel) {
    await page.evaluate(`(async () => {
      var client = window.client;
      var ch = client.channel('messaging', ${JSON.stringify(CHANNEL_ID)}, {
        name: 'Reactions Demo',
        members: [${JSON.stringify(USER_A)}, ${JSON.stringify(USER_B)}],
      });
      await ch.create();
    })()`);
    console.log(`  📦 Channel "${CHANNEL_ID}" created`);
  }

  const channelUrl = `${BASE_URL}/?theme=light&view=chat&channel=${CHANNEL_ID}&user_id=${userId}&user_name=${userName}`;
  await page.goto(channelUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.waitForFunction('!!window.client && !!window.channel', null, {
    timeout: 15000,
  });
  return page;
}

// ─── Seed ─────────────────────────────────────────────────────────

async function seedChannel(contextA: BrowserContext, contextB: BrowserContext) {
  console.log('🌱 Seeding channel...');

  const pageA = await initSession(contextA, USER_A, USER_A, true);
  const pageB = await initSession(contextB, USER_B, USER_B);

  // Send messages
  const r1: any = await pageA.evaluate(`(async () => {
    var ch = window.channel;
    var m = await ch.sendMessage({ text: 'What do you think about the new design?' });
    return { id: m.message.id };
  })()`);

  await pageB.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendMessage({ text: 'I love it! The color scheme is much better.' });
  })()`);

  const r3: any = await pageA.evaluate(`(async () => {
    var ch = window.channel;
    var m = await ch.sendMessage({ text: 'Great to hear! Should we ship it this week?' });
    return { id: m.message.id };
  })()`);

  // Add reactions to messages
  // Marco reacts to his own first message with 'like'
  await pageA.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendReaction(${JSON.stringify(r1.id)}, { type: 'like' });
  })()`);
  // John reacts to first message with 'love'
  await pageB.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendReaction(${JSON.stringify(r1.id)}, { type: 'love' });
  })()`);
  // John reacts to third message with 'like'
  await pageB.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendReaction(${JSON.stringify(r3.id)}, { type: 'like' });
  })()`);

  // Add upvote/downvote reactions (for custom options variant)
  await pageA.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendReaction(${JSON.stringify(r3.id)}, { type: 'arrow_up' });
  })()`);
  await pageB.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendReaction(${JSON.stringify(r1.id)}, { type: 'arrow_up' });
  })()`);

  console.log('  ✅ Channel seeded');
  await pageA.close();
  await pageB.close();
}

// ─── Screenshot ───────────────────────────────────────────────────

const MESSAGE_LIST_SELECTORS = [
  '.str-chat__message-list',
  '.str-chat__ul',
  '.str-chat__channel',
];

async function screenshotMessageList(page: Page, outputPath: string) {
  for (const selector of MESSAGE_LIST_SELECTORS) {
    const el = page.locator(selector);
    if ((await el.count()) > 0) {
      await el.first().screenshot({ path: outputPath });
      return selector;
    }
  }
  return null;
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  const browser = await chromium.launch({ headless: true });

  const contextA = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const contextB = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  await seedChannel(contextA, contextB);

  const screenshotContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  // 1. Custom reaction options (upvote/downvote) with selector open
  console.log('📸 Capturing custom reaction options...');
  const page1 = await screenshotContext.newPage();
  await page1.goto(
    `${BASE_URL}/?theme=light&view=chat&channel=${CHANNEL_ID}&user_id=${USER_B}&user_name=${USER_B}&reactions=custom-options`,
    { waitUntil: 'networkidle' },
  );
  await page1.waitForSelector('[data-message-id]', { timeout: 15000 });
  await page1.waitForTimeout(2000);
  await screenshotMessageList(
    page1,
    path.join(OUTPUT_DIR, 'reactions-custom-options.png'),
  );
  console.log('  ✅ Saved reactions-custom-options.png');
  await page1.close();

  // 2. Segmented reactions list
  console.log('📸 Capturing segmented reactions list...');
  const page2 = await screenshotContext.newPage();
  await page2.goto(
    `${BASE_URL}/?theme=light&view=chat&channel=${CHANNEL_ID}&user_id=${USER_B}&user_name=${USER_B}&reactions=segmented`,
    { waitUntil: 'networkidle' },
  );
  await page2.waitForSelector('[data-message-id]', { timeout: 15000 });
  await page2.waitForTimeout(2000);
  await screenshotMessageList(page2, path.join(OUTPUT_DIR, 'reactions-segmented.png'));
  console.log('  ✅ Saved reactions-segmented.png');
  await page2.close();

  // 3. Default (clustered) reactions list for comparison
  console.log('📸 Capturing default clustered reactions list...');
  const page3 = await screenshotContext.newPage();
  await page3.goto(
    `${BASE_URL}/?theme=light&view=chat&channel=${CHANNEL_ID}&user_id=${USER_B}&user_name=${USER_B}`,
    { waitUntil: 'networkidle' },
  );
  await page3.waitForSelector('[data-message-id]', { timeout: 15000 });
  await page3.waitForTimeout(2000);
  await screenshotMessageList(page3, path.join(OUTPUT_DIR, 'reactions-clustered.png'));
  console.log('  ✅ Saved reactions-clustered.png');
  await page3.close();

  await browser.close();
  console.log('\n🎉 Done! Screenshots saved to:', OUTPUT_DIR);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
