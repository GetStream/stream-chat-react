/**
 * Takes Tier 1 screenshots: poll, giphy preview, localization (English).
 * Run: node scripts/take-tier1-screenshots.mjs
 */
import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.resolve(
  __dirname,
  '../../docs/data/docs/chat-sdk/react/v14/_assets',
);
const BASE_URL = process.env.BASE_URL || 'http://localhost:5175';
const USER = 'stream_dev_alice';

function url(params = {}) {
  const p = new URLSearchParams({ theme: 'light', user_id: USER, ...params });
  return `${BASE_URL}/?${p}`;
}

async function waitForChat(page) {
  await page.waitForSelector('.str-chat__channel-list', { timeout: 20000 });
  await page.waitForSelector('.str-chat__message-list', { timeout: 20000 });
  await page.waitForTimeout(2000);
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // -----------------------------------------------------------------------
  // 1. message-with-poll.png — screenshot a poll in the General channel
  // -----------------------------------------------------------------------
  console.log('1. message-with-poll.png');
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url({ view: 'chat', channel: 'general' }));
    await waitForChat(page);

    // Find a poll that's not just "Vote ended" — look for one with options
    const polls = page.locator('.str-chat__poll');
    const count = await polls.count();
    console.log(`  Found ${count} polls`);

    if (count > 0) {
      // Scroll the first poll into view and screenshot it
      const poll = polls.first();
      await poll.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Screenshot the message containing the poll (includes bubble + metadata)
      const pollMessage = poll
        .locator('xpath=ancestor::div[contains(@class,"str-chat__message")]')
        .first();
      if (await pollMessage.isVisible().catch(() => false)) {
        await pollMessage.screenshot({
          path: path.join(ASSETS_DIR, 'message-with-poll.png'),
        });
      } else {
        // Fallback: screenshot just the poll
        await poll.screenshot({ path: path.join(ASSETS_DIR, 'message-with-poll.png') });
      }
      console.log('  ✓ message-with-poll.png');
    } else {
      console.warn('  ⚠ No polls found in General channel');
    }
    await page.close();
  }

  // -----------------------------------------------------------------------
  // 2. GiphyPreview.png — type /giphy command and screenshot the preview
  // -----------------------------------------------------------------------
  console.log('2. GiphyPreview.png');
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url({ view: 'chat', channel: 'internal' }));
    await waitForChat(page);

    const textarea = page.locator('.str-chat__message-textarea').first();
    await textarea.click();
    await textarea.fill('/giphy wave');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(4000); // wait for GIF to load

    // The giphy preview appears as an ephemeral message with action buttons
    // Look for the giphy card or the "Only visible to you" message
    const giphyCard = page
      .locator('.str-chat__message-attachment--giphy, [class*="giphy"]')
      .last();
    if (await giphyCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Screenshot the message containing the giphy preview
      const giphyMessage = giphyCard
        .locator('xpath=ancestor::li[contains(@class,"str-chat__li")]')
        .first();
      if (await giphyMessage.isVisible().catch(() => false)) {
        await giphyMessage.screenshot({
          path: path.join(ASSETS_DIR, 'GiphyPreview.png'),
        });
        console.log('  ✓ GiphyPreview.png');
      } else {
        await giphyCard.screenshot({ path: path.join(ASSETS_DIR, 'GiphyPreview.png') });
        console.log('  ✓ GiphyPreview.png (card only)');
      }
    } else {
      // Fallback: screenshot the bottom of the message list
      console.log('  Giphy card not found by class, taking full message area screenshot');
      const msgList = page.locator('.str-chat__message-list').first();
      await msgList.screenshot({ path: path.join(ASSETS_DIR, 'GiphyPreview.png') });
      console.log('  ✓ GiphyPreview.png (message list)');
    }
    await page.close();
  }

  // -----------------------------------------------------------------------
  // 3. Localization1.png — English UI with message actions visible
  // -----------------------------------------------------------------------
  console.log('3. Localization1.png');
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url({ view: 'chat', channel: 'internal' }));
    await waitForChat(page);

    // Find a text message and hover to show the action toolbar
    const textMessages = page.locator('.str-chat__message--has-text');
    const msgCount = await textMessages.count();

    if (msgCount > 0) {
      // Pick a message in the middle of the visible area
      const targetIdx = Math.max(0, msgCount - 3);
      const msg = textMessages.nth(targetIdx);
      await msg.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);

      // Hover to show the message options toolbar
      const box = await msg.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(400);

        // Click the "..." more actions button to open the actions menu
        const moreBtn = page.locator('.str-chat__message-actions-box-button').last();
        if (await moreBtn.isVisible({ timeout: 500 }).catch(() => false)) {
          await moreBtn.click();
          await page.waitForTimeout(500);
        }
      }

      // Screenshot a section showing the message with its action menu
      // Capture the message list area (not full page) for a focused view
      const msgList = page.locator('.str-chat__message-list').first();
      await msgList.screenshot({ path: path.join(ASSETS_DIR, 'Localization1.png') });
      console.log('  ✓ Localization1.png');
    }
    await page.close();
  }

  console.log('\n✅ Done!');
  console.log('\n⚠ Not automated (need app-level config):');
  console.log('  - Localization2.png — needs defaultLanguage="it" on Chat component');
  console.log('  - Diacritics.png — needs user with diacritical name in the channel');
  console.log(
    '  - Transliteration.png — needs useMentionsTransliteration prop + Cyrillic user',
  );

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
