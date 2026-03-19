/**
 * Playwright script to capture screenshots of each Custom Message UI variant
 * for the cookbook documentation.
 *
 * Usage:
 *   npx tsx examples/vite/screenshot-variants.ts
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
const CHANNEL_ID = `cookbook-msg-ui-${Date.now()}`;
const USER_A = 'Marco';
const USER_B = 'John';
const OUTPUT_DIR = path.resolve(
  __dirname,
  '../../../docs/data/docs/chat-sdk/react/v14/_assets',
);

const variants = ['0', '1', '2', '3a', '3b', '4', '5', '6', '7', '8'] as const;

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
        name: 'Cookbook Screenshots',
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

  // Build the full conversation from both sides.
  // We return message IDs so we can add reactions, threads, edits, and deletes.
  const result: any = await pageA.evaluate(`(async () => {
    var ch = window.channel;
    var client = window.client;

    // 1. Marco: opening message
    var m1 = await ch.sendMessage({ text: 'Hey, John, how are you doing?' });

    return { m1Id: m1.message.id };
  })()`);

  const result2: any = await pageB.evaluate(
    `(async () => {
    var ch = window.channel;
    var client = window.client;

    // 2. John: reply
    var m2 = await ch.sendMessage({ text: 'Hey, hey! Doing well \\u2013 how about you?' });

    return { m2Id: m2.message.id };
  })()`,
  );

  const result3: any = await pageA.evaluate(`(async () => {
    var ch = window.channel;

    // 3. Marco: long reply
    var m3 = await ch.sendMessage({
      text: "Ah, thanks for asking! I'm doing quite well, all things considered. Every day brings its own set of challenges and opportunities, but overall, I'm feeling positive and motivated. I've been keeping busy learning new things."
    });

    return { m3Id: m3.message.id };
  })()`);

  // 4. John: mention + edit (so it shows "Edited")
  const result4: any = await pageB.evaluate(
    `(async () => {
    var ch = window.channel;
    var client = window.client;

    var m4 = await ch.sendMessage({
      text: '@Marco hey! How are you?',
      mentioned_users: [${JSON.stringify(USER_A)}]
    });

    // Edit to trigger "Edited" indicator
    await client.updateMessage({
      id: m4.message.id,
      text: '@Marco hey! How are you?',
      mentioned_users: [${JSON.stringify(USER_A)}]
    });

    return { m4Id: m4.message.id };
  })()`,
  );

  // 5. John: link message
  const result5: any = await pageB.evaluate(`(async () => {
    var ch = window.channel;
    var m5 = await ch.sendMessage({ text: 'Check out this link:\\nhttps://getstream.io/' });
    return { m5Id: m5.message.id };
  })()`);

  // 6. Marco: markdown message
  const result6: any = await pageA.evaluate(`(async () => {
    var ch = window.channel;
    var m6 = await ch.sendMessage({
      text: "Here's some ~~styled text~~ **Markdown**, *too*!"
    });
    return { m6Id: m6.message.id };
  })()`);

  // 7. Marco: consecutive messages for grouping demo (V5)
  await pageA.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendMessage({ text: 'This message right here...' });
    await ch.sendMessage({ text: '...will be grouped with this one.' });
    await ch.sendMessage({ text: 'And this one as well!' });
  })()`);

  // 8. Add a thread reply on the markdown message (for reply_count in V7/V8)
  await pageB.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendMessage({
      text: 'Nice formatting!',
      parent_id: ${JSON.stringify(result6.m6Id)}
    });
  })()`);

  // 9. Add reactions on the mention message (for V8)
  await pageA.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendReaction(${JSON.stringify(result4.m4Id)}, { type: '+1' });
  })()`);
  await pageB.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendReaction(${JSON.stringify(result4.m4Id)}, { type: '-1' });
  })()`);

  // 10. Marco sends one more message, then soft-deletes it (for V7/V8)
  const result10: any = await pageA.evaluate(`(async () => {
    var ch = window.channel;
    var client = window.client;
    var m = await ch.sendMessage({ text: 'Actually, never mind about that last point.' });
    await client.deleteMessage(m.message.id);
    return { deletedId: m.message.id };
  })()`);

  console.log('  ✅ Channel seeded');
  console.log('    Messages:', {
    m1: result.m1Id,
    m2: result2.m2Id,
    m3: result3.m3Id,
    m4: result4.m4Id,
    m5: result5.m5Id,
    m6: result6.m6Id,
    deleted: result10.deletedId,
  });

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

  // Screenshots from John's perspective (Marco's messages on the left)
  const screenshotContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await screenshotContext.newPage();

  for (const variant of variants) {
    const url = `${BASE_URL}/?theme=light&view=chat&channel=${CHANNEL_ID}&user_id=${USER_B}&user_name=${USER_B}&message_ui=${variant}`;
    console.log(`📸 Capturing variant ${variant}...`);

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-message-id]', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // For variant 6, hover to show actions toolbar
    if (variant === '6') {
      // Hover over the edited "@Marco hey!" message
      const messages = page.locator('.custom-message-ui');
      const count = await messages.count();
      if (count >= 4) {
        await messages.nth(3).hover(); // 4th message = @Marco hey!
        await page.waitForTimeout(500);
      }
    }

    // For variant 7, hover the last visible (non-deleted) message
    if (variant === '7') {
      const messages = page.locator('.custom-message-ui');
      const count = await messages.count();
      if (count > 1) {
        // Hover the markdown message (second to last, before deleted)
        await messages.nth(count - 2).hover();
        await page.waitForTimeout(500);
      }
    }

    const outputPath = path.join(OUTPUT_DIR, `custom-message-ui-${variant}.png`);
    const usedSelector = await screenshotMessageList(page, outputPath);
    if (usedSelector) {
      console.log(`  ✅ Saved custom-message-ui-${variant}.png (via ${usedSelector})`);
    } else {
      console.log(`  ⚠️  Could not find message list for variant ${variant}`);
    }
  }

  await browser.close();
  console.log('\n🎉 Done! Screenshots saved to:', OUTPUT_DIR);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
