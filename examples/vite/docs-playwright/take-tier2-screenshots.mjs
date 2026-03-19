/**
 * Takes Tier 2 screenshots that need specific app state.
 * Run: node scripts/take-tier2-screenshots.mjs
 */
import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.resolve(
  __dirname,
  '../../docs/data/docs/chat-sdk/react/v14/_assets',
);
const BASE = process.env.BASE_URL || 'http://localhost:5175';
const USER_A = 'stream_dev_alice';
const USER_B = 'stream_dev_bob';

function url(params = {}) {
  const p = new URLSearchParams({ theme: 'light', user_id: USER_A, ...params });
  return `${BASE}/?${p}`;
}

async function waitForChat(page) {
  await page.waitForSelector('.str-chat__channel-list', { timeout: 20000 });
  await page.waitForSelector('.str-chat__message-list', { timeout: 20000 });
  await page.waitForTimeout(2000);
}

// Get the Stream Chat client from the React fiber tree
async function getClient(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.str-chat__channel');
    if (!el) return null;
    const key = Object.keys(el).find((k) => k.startsWith('__reactFiber'));
    if (!key) return null;
    let fiber = el[key];
    while (fiber) {
      if (fiber.memoizedProps?.client?.createPoll) return true; // client exists
      fiber = fiber.return;
    }
    return null;
  });
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // -----------------------------------------------------------------------
  // 1. voice-recording-player.png — screenshot an existing voice recording
  // -----------------------------------------------------------------------
  console.log('1. voice-recording-player.png');
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url({ view: 'chat', channel: 'internal' }));
    await waitForChat(page);

    const voiceRecording = page
      .locator('.str-chat__message-attachment--voiceRecording')
      .first();
    if (await voiceRecording.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Screenshot the message containing the voice recording
      const msg = voiceRecording
        .locator('xpath=ancestor::li[contains(@class,"str-chat__li")]')
        .first();
      if (await msg.isVisible().catch(() => false)) {
        await msg.screenshot({
          path: path.join(ASSETS_DIR, 'voice-recording-player.png'),
        });
      } else {
        await voiceRecording.screenshot({
          path: path.join(ASSETS_DIR, 'voice-recording-player.png'),
        });
      }
      console.log('  ✓ voice-recording-player.png');
    } else {
      console.warn('  ⚠ No voice recording found, skipping');
    }
    await page.close();
  }

  // -----------------------------------------------------------------------
  // 2. default-system-message.png — trigger a system message by adding a member
  // -----------------------------------------------------------------------
  console.log('2. default-system-message.png');
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url({ view: 'chat', channel: 'internal' }));
    await waitForChat(page);

    // Use the API to add then remove a member to trigger system messages
    const hasSystemMsg = await page.evaluate(async () => {
      const el = document.querySelector('.str-chat__channel');
      if (!el) return false;
      const key = Object.keys(el).find((k) => k.startsWith('__reactFiber'));
      if (!key) return false;
      let fiber = el[key];
      let channel = null;
      while (fiber) {
        if (fiber.memoizedProps?.channel?.addMembers) {
          channel = fiber.memoizedProps.channel;
          break;
        }
        fiber = fiber.return;
      }
      if (!channel) return false;

      // Add a temp member to create a system message
      try {
        await channel.addMembers(['stream_dev_temp_user']);
        await new Promise((r) => setTimeout(r, 500));
        await channel.removeMembers(['stream_dev_temp_user']);
        return true;
      } catch {
        return false;
      }
    });

    if (hasSystemMsg) {
      await page.waitForTimeout(2000);
      // Find and screenshot the system message
      const systemMsg = page.locator('.str-chat__message--system').last();
      if (await systemMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
        await systemMsg.screenshot({
          path: path.join(ASSETS_DIR, 'default-system-message.png'),
        });
        console.log('  ✓ default-system-message.png');
      } else {
        console.warn('  ⚠ System message not visible after member add/remove');
      }
    } else {
      console.warn('  ⚠ Could not add member to trigger system message');
    }
    await page.close();
  }

  // -----------------------------------------------------------------------
  // 3. AttachmentActions1.png + AttachmentActions2.png — Giphy with actions
  // -----------------------------------------------------------------------
  console.log('3. AttachmentActions1.png / AttachmentActions2.png');
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url({ view: 'chat', channel: 'internal' }));
    await waitForChat(page);

    // Send a /giphy command
    const textarea = page.locator('.str-chat__message-textarea').first();
    await textarea.click();
    await textarea.fill('/giphy thumbs up');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(4000);

    // Screenshot the giphy preview with action buttons (Send/Shuffle/Cancel)
    const giphyAttachment = page
      .locator('[class*="giphy"], .str-chat__message-attachment--giphy')
      .last();
    const giphyMsg = giphyAttachment
      .locator('xpath=ancestor::li[contains(@class,"str-chat__li")]')
      .first();

    if (await giphyMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
      await giphyMsg.screenshot({
        path: path.join(ASSETS_DIR, 'AttachmentActions1.png'),
      });
      console.log('  ✓ AttachmentActions1.png (giphy preview with actions)');

      // Click "Send" to confirm the giphy
      const sendBtn = page.locator('button:has-text("Send")').last();
      if (await sendBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await sendBtn.click();
        await page.waitForTimeout(2000);

        // Screenshot the sent giphy message (no more action buttons)
        const sentGiphy = page
          .locator('.str-chat__message-attachment--giphy, [class*="giphy"]')
          .last();
        const sentMsg = sentGiphy
          .locator('xpath=ancestor::li[contains(@class,"str-chat__li")]')
          .first();
        if (await sentMsg.isVisible().catch(() => false)) {
          await sentMsg.screenshot({
            path: path.join(ASSETS_DIR, 'AttachmentActions2.png'),
          });
          console.log('  ✓ AttachmentActions2.png (giphy sent)');
        }
      }
    } else {
      console.warn('  ⚠ Giphy preview not found');
    }
    await page.close();
  }

  // -----------------------------------------------------------------------
  // 4. custom-pin-indicator.png — pin a message and screenshot
  // -----------------------------------------------------------------------
  console.log('4. custom-pin-indicator.png');
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url({ view: 'chat', channel: 'internal' }));
    await waitForChat(page);

    // Pin a message via the API
    const pinned = await page.evaluate(async () => {
      const el = document.querySelector('.str-chat__channel');
      if (!el) return false;
      const key = Object.keys(el).find((k) => k.startsWith('__reactFiber'));
      if (!key) return false;
      let fiber = el[key];
      let client = null;
      let channel = null;
      while (fiber) {
        if (fiber.memoizedProps?.client?.pinMessage && !client)
          client = fiber.memoizedProps.client;
        if (fiber.memoizedProps?.channel?.state?.messages && !channel)
          channel = fiber.memoizedProps.channel;
        if (client && channel) break;
        fiber = fiber.return;
      }
      if (!client || !channel) return false;

      // Find a text message to pin
      const messages = channel.state.messages;
      const textMsg = messages.find((m) => m.text && !m.pinned && m.type === 'regular');
      if (!textMsg) return false;

      try {
        await client.pinMessage(textMsg, null);
        return true;
      } catch {
        return false;
      }
    });

    if (pinned) {
      await page.waitForTimeout(2000);
      const pinnedMsg = page.locator('.str-chat__message--pinned').first();
      if (await pinnedMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
        await pinnedMsg.screenshot({
          path: path.join(ASSETS_DIR, 'custom-pin-indicator.png'),
        });
        console.log('  ✓ custom-pin-indicator.png');
      } else {
        console.warn('  ⚠ Pinned message not visible');
      }
    } else {
      console.warn('  ⚠ Could not pin message');
    }

    // custom-pin-indicator-css.png — same pinned message with custom CSS
    const pinnedMsg2 = page.locator('.str-chat__message--pinned').first();
    if (await pinnedMsg2.isVisible().catch(() => false)) {
      await page.addStyleTag({
        content: `
          .str-chat__message-pin-indicator {
            background: #fff3e0;
            border: 1px solid #ff9800;
            border-radius: 4px;
            padding: 2px 8px;
          }
          .str-chat__message-pin-indicator__icon { color: #ff9800; }
        `,
      });
      await page.waitForTimeout(300);
      await pinnedMsg2.screenshot({
        path: path.join(ASSETS_DIR, 'custom-pin-indicator-css.png'),
      });
      console.log('  ✓ custom-pin-indicator-css.png');
    }
    await page.close();
  }

  // -----------------------------------------------------------------------
  // 5. Localization screenshots (now that ?language= works)
  // -----------------------------------------------------------------------
  console.log('5. Localization1.png / Localization2.png');
  {
    // English
    const pageEn = await browser.newPage();
    await pageEn.setViewportSize({ width: 1280, height: 900 });
    await pageEn.goto(url({ view: 'chat', channel: 'internal' }));
    await waitForChat(pageEn);
    await pageEn
      .locator('.str-chat__message-list')
      .first()
      .screenshot({
        path: path.join(ASSETS_DIR, 'Localization1.png'),
      });
    console.log('  ✓ Localization1.png');
    await pageEn.close();

    // Italian
    const pageIt = await browser.newPage();
    await pageIt.setViewportSize({ width: 1280, height: 900 });
    await pageIt.goto(url({ view: 'chat', channel: 'internal', language: 'it' }));
    await waitForChat(pageIt);
    await pageIt
      .locator('.str-chat__message-list')
      .first()
      .screenshot({
        path: path.join(ASSETS_DIR, 'Localization2.png'),
      });
    console.log('  ✓ Localization2.png');
    await pageIt.close();
  }

  console.log('\n✅ Done!');
  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
