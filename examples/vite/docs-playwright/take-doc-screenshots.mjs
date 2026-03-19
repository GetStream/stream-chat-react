/**
 * Script to take documentation screenshots for the v14 React Chat SDK docs.
 * Run from the stream-chat-react directory:
 *   node scripts/take-doc-screenshots.mjs
 */

import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.resolve(
  __dirname,
  '../../docs/data/docs/chat-sdk/react/v14/_assets',
);
const APP_URL = process.env.BASE_URL || 'http://localhost:5175';

// How long to wait for the chat UI to fully load (messages, avatars, etc.)
const UI_LOAD_TIMEOUT = 8000;

async function waitForChatUI(page) {
  // Wait for the channel list to appear
  await page.waitForSelector('.str-chat__channel-list', { timeout: UI_LOAD_TIMEOUT });
  // Wait for a channel to be selected (message list visible)
  await page.waitForSelector('.str-chat__message-list', { timeout: UI_LOAD_TIMEOUT });
  // Extra settle time for images/avatars
  await page.waitForTimeout(1500);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const errors = [];

  try {
    console.log('Taking default (light theme) screenshots...');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`${APP_URL}?theme=light`);
      await waitForChatUI(page);

      // Full UI screenshot
      await page.screenshot({
        path: path.join(ASSETS_DIR, 'stream-chat-css-chat-ui-screenshot.png'),
      });
      console.log('  ✓ stream-chat-css-chat-ui-screenshot.png');

      // Channel list (left panel)
      const channelList = page.locator('.str-chat__channel-list').first();
      await channelList.screenshot({
        path: path.join(ASSETS_DIR, 'default-channel-list.png'),
      });
      console.log('  ✓ default-channel-list.png');

      // Channel header
      const channelHeader = page.locator('.str-chat__channel-header').first();
      await channelHeader.screenshot({
        path: path.join(ASSETS_DIR, 'default-channel-header.png'),
      });
      console.log('  ✓ default-channel-header.png');

      // Message list (scroll area)
      const messageList = page.locator('.str-chat__message-list').first();
      await messageList.screenshot({
        path: path.join(ASSETS_DIR, 'default-message-list.png'),
      });
      console.log('  ✓ default-message-list.png');

      // Message input (composer)
      const messageInput = page.locator('.str-chat__message-composer-container').first();
      await messageInput.screenshot({
        path: path.join(ASSETS_DIR, 'default-message-input.png'),
      });
      console.log('  ✓ default-message-input.png');

      // Emoji picker — click the emoji button to open it
      const emojiBtn = page.locator('.str-chat__emoji-picker-button').first();
      if (await emojiBtn.isVisible()) {
        await emojiBtn.click();
        await page.waitForTimeout(800);
        const emojiPicker = page.locator('em-emoji-picker').first();
        if (await emojiPicker.isVisible()) {
          await emojiPicker.screenshot({
            path: path.join(ASSETS_DIR, 'default-emoji-picker.png'),
          });
          console.log('  ✓ default-emoji-picker.png');
        } else {
          console.warn('  ⚠ Emoji picker not visible after click, skipping');
          errors.push('default-emoji-picker.png: picker not visible');
        }
        // Close picker
        await page.keyboard.press('Escape');
      } else {
        console.warn('  ⚠ Emoji picker trigger not found, skipping');
        errors.push('default-emoji-picker.png: trigger button not found');
      }

      await page.close();
    }

    console.log('\nTaking dark theme screenshot...');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`${APP_URL}?theme=dark`);
      await waitForChatUI(page);

      await page.screenshot({
        path: path.join(ASSETS_DIR, 'stream-chat-css-dark-ui-screenshot.png'),
      });
      console.log('  ✓ stream-chat-css-dark-ui-screenshot.png');

      await page.close();
    }

    console.log('\nTaking thread screenshot...');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`${APP_URL}?theme=light`);
      await waitForChatUI(page);

      // Find a message with a reply count and click it to open thread
      const replyBtn = page.locator('.str-chat__message-replies-count-button').first();
      if (await replyBtn.isVisible({ timeout: 3000 })) {
        await replyBtn.click();
        await page.waitForTimeout(1500);
        // Thread is the right-side panel inside the channel
        const thread = page.locator('.str-chat__dropzone-root--thread').first();
        if (await thread.isVisible({ timeout: 3000 })) {
          await thread.screenshot({
            path: path.join(ASSETS_DIR, 'default-thread.png'),
          });
          console.log('  ✓ default-thread.png');
        } else {
          console.warn('  ⚠ Thread panel not visible after click, skipping');
          errors.push('default-thread.png: thread panel not visible');
        }
      } else {
        console.warn('  ⚠ No reply button found, skipping default-thread.png');
        errors.push('default-thread.png: no reply button found');
      }

      await page.close();
    }

    console.log('\nDone!');
    if (errors.length > 0) {
      console.log('\nWarnings/skipped:');
      errors.forEach((e) => console.log('  -', e));
    }
    console.log(`\nScreenshots saved to:\n  ${ASSETS_DIR}`);
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
