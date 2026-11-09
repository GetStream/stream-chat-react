/**
 * Playwright script to capture screenshots for the Attachment Actions cookbook.
 *
 * Captures:
 *   1. AttachmentActions1.png — Image with Love/Loathe buttons (before click)
 *   2. AttachmentActions2.png — Same image after clicking Love (with ❤️ reaction)
 *
 * Usage:
 *   npx tsx examples/vite/screenshot-attachment-actions.ts
 *
 * Prerequisites:
 *   - The vite dev server must be running at http://localhost:5175
 */

import { chromium, type BrowserContext } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5175';
const CHANNEL_ID = `cookbook-att-actions-${Date.now()}`;
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
        name: 'Attachment Actions Demo',
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

async function seedChannel(contextA: BrowserContext) {
  console.log('🌱 Seeding channel...');

  const pageA = await initSession(contextA, USER_A, USER_A, true);

  // Send a message with an image attachment that has custom actions
  await pageA.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendMessage({
      text: '',
      attachments: [{
        type: 'image',
        title: 'mountain-landscape.jpg',
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        thumb_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        actions: [
          { name: 'vote', value: 'Love' },
          { name: 'vote', value: 'Loathe' },
        ],
      }],
    });
  })()`);

  console.log('  ✅ Channel seeded');
  await pageA.close();
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  const browser = await chromium.launch({ headless: true });

  const contextA = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await seedChannel(contextA);

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  // 1. Screenshot BEFORE clicking — shows Love/Loathe buttons
  console.log('📸 AttachmentActions1.png (before click)...');
  const page1 = await ctx.newPage();
  await page1.goto(
    `${BASE_URL}/?theme=light&view=chat&channel=${CHANNEL_ID}&user_id=${USER_B}&user_name=${USER_B}&attachment_actions=custom`,
    { waitUntil: 'networkidle' },
  );
  await page1.waitForSelector('[data-message-id]', { timeout: 15000 });
  await page1.waitForTimeout(2000);

  // Screenshot the message bubble containing the image + action buttons
  const messageBubble = page1.locator('.str-chat__message-bubble').first();
  if ((await messageBubble.count()) > 0) {
    await messageBubble.screenshot({
      path: path.join(OUTPUT_DIR, 'AttachmentActions1.png'),
    });
    console.log('  ✅ Saved');
  } else {
    console.log('  ⚠️  Message bubble not found');
  }

  // 2. Click "Love" button, then screenshot AFTER — shows reaction
  console.log('📸 AttachmentActions2.png (after click)...');
  const loveButton = page1.locator('.action-button.love');
  if ((await loveButton.count()) > 0) {
    await loveButton.click();
    await page1.waitForTimeout(1500);

    const messageBubbleAfter = page1.locator('.str-chat__message-bubble').first();
    await messageBubbleAfter.screenshot({
      path: path.join(OUTPUT_DIR, 'AttachmentActions2.png'),
    });
    console.log('  ✅ Saved');
  } else {
    console.log('  ⚠️  Love button not found');
  }

  await page1.close();
  await browser.close();
  console.log('\n🎉 Done! Screenshots saved to:', OUTPUT_DIR);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
