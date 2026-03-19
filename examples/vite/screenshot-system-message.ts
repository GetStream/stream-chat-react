/**
 * Playwright script to capture screenshots for the System Message cookbook.
 *
 * Usage:
 *   npx tsx examples/vite/screenshot-system-message.ts
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
const CHANNEL_ID = `cookbook-sys-msg-${Date.now()}`;
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
        name: 'System Message Demo',
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

  // Send a few normal messages for context
  await pageA.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendMessage({ text: 'Hey John, quick question about the project' });
  })()`);

  await pageB.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendMessage({ text: 'Sure, what is it?' });
  })()`);

  // Inject a system message into channel state via truncate with a system message
  // Using addMembers with a message generates a system message
  // Actually, the simplest way: use channel.sendMessage with type override won't work client-side.
  // Let's use channel.truncate with a message option which creates a system message,
  // or we can inject directly into state.

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

  const injectSystemMessage = `(async () => {
    var ch = window.channel;
    var client = window.client;
    var now = new Date().toISOString();
    var msg = {
      id: 'system-msg-' + Date.now(),
      text: '/mute @${USER_B}',
      type: 'system',
      created_at: now,
      updated_at: now,
      user: { id: '${USER_A}', name: '${USER_A}', image: '' },
      cid: ch.cid,
    };
    // Dispatch as a message.new event so React picks it up
    client.dispatchEvent({
      type: 'message.new',
      cid: ch.cid,
      channel_id: ch.id,
      channel_type: ch.type,
      message: msg,
      user: msg.user,
      created_at: now,
    });
  })()`;

  // 1. Default system message
  console.log('📸 Capturing default system message...');
  const page1 = await screenshotContext.newPage();
  await page1.goto(
    `${BASE_URL}/?theme=light&view=chat&channel=${CHANNEL_ID}&user_id=${USER_B}&user_name=${USER_B}`,
    { waitUntil: 'networkidle' },
  );
  await page1.waitForSelector('[data-message-id]', { timeout: 15000 });
  await page1.waitForTimeout(1000);
  await page1.evaluate(injectSystemMessage);
  await page1.waitForSelector('[data-testid="message-system"]', { timeout: 5000 });
  await page1.waitForTimeout(500);

  const defaultSystemMsg = page1.locator('[data-testid="message-system"]').first();
  await defaultSystemMsg.screenshot({
    path: path.join(OUTPUT_DIR, 'default-system-message.png'),
  });
  console.log('  ✅ Saved default-system-message.png');
  await page1.close();

  // 2. Custom system message (rainbow)
  console.log('📸 Capturing custom system message...');
  const page2 = await screenshotContext.newPage();
  await page2.goto(
    `${BASE_URL}/?theme=light&view=chat&channel=${CHANNEL_ID}&user_id=${USER_B}&user_name=${USER_B}&system_message=custom`,
    { waitUntil: 'networkidle' },
  );
  await page2.waitForSelector('[data-message-id]', { timeout: 15000 });
  await page2.waitForTimeout(1000);
  await page2.evaluate(injectSystemMessage);
  await page2.waitForSelector('.custom-system-message', { timeout: 5000 });
  await page2.waitForTimeout(500);

  const customSystemMsg = page2.locator('.custom-system-message').first();
  await customSystemMsg.screenshot({
    path: path.join(OUTPUT_DIR, 'custom-system-message.png'),
  });
  console.log('  ✅ Saved custom-system-message.png');
  await page2.close();

  await browser.close();
  console.log('\n🎉 Done! Screenshots saved to:', OUTPUT_DIR);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
