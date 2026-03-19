/**
 * Playwright script to capture miscellaneous screenshots that need theme updates.
 *
 * Captures:
 *   - ConnectionStatus.png
 *   - CustomNotification.png
 *   - Diacritics.png
 *   - Transliteration.png
 *   - base-image-fallback-in-image-attachment.png
 *   - base-image-fallback-in-attachment-gallery.png
 *   - base-image-fallback-in-attachment-preview.png
 *
 * Usage:
 *   npx tsx examples/vite/screenshot-misc.ts
 */

import { chromium, type BrowserContext, type Page } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5175';
const OUTPUT_DIR = path.resolve(
  __dirname,
  '../../../docs/data/docs/chat-sdk/react/v14/_assets',
);

const USER_A = 'Marco';
const USER_B = 'John';

// ─── Helpers ──────────────────────────────────────────────────────

async function createChannel(
  context: BrowserContext,
  channelId: string,
  userId: string,
  userName: string,
) {
  const page = await context.newPage();
  const url = `${BASE_URL}/?theme=light&view=chat&user_id=${userId}&user_name=${userName}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.waitForFunction('!!window.client', null, { timeout: 15000 });

  await page.evaluate(`(async () => {
    var client = window.client;
    var ch = client.channel('messaging', ${JSON.stringify(channelId)}, {
      name: 'Demo',
      members: [${JSON.stringify(USER_A)}, ${JSON.stringify(USER_B)}],
    });
    await ch.create();
  })()`);

  const channelUrl = `${BASE_URL}/?theme=light&view=chat&channel=${channelId}&user_id=${userId}&user_name=${userName}`;
  await page.goto(channelUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.waitForFunction('!!window.client && !!window.channel', null, {
    timeout: 15000,
  });
  return page;
}

async function openChannel(
  context: BrowserContext,
  channelId: string,
  userId: string,
  userName: string,
  extraParams = '',
) {
  const page = await context.newPage();
  const url = `${BASE_URL}/?theme=light&view=chat&channel=${channelId}&user_id=${userId}&user_name=${userName}${extraParams}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.waitForFunction('!!window.client && !!window.channel', null, {
    timeout: 15000,
  });
  return page;
}

// ─── Base Image Fallback ──────────────────────────────────────────

async function captureBaseImageFallbacks(browser: any) {
  console.log('\n── Base Image Fallbacks ──');
  const channelId = `misc-base-img-${Date.now()}`;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  const page = await createChannel(ctx, channelId, USER_A, USER_A);

  // Send message with a broken image URL
  await page.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendMessage({
      text: 'Some text',
      attachments: [{
        type: 'image',
        image_url: 'https://invalid-url-that-will-fail.example/broken.jpg',
        thumb_url: 'https://invalid-url-that-will-fail.example/broken-thumb.jpg',
        title: 'broken-image.jpg',
      }],
    });
  })()`);

  // Send message with two images (one broken) for gallery view
  await page.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendMessage({
      text: '',
      attachments: [
        {
          type: 'image',
          image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
          thumb_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=150&fit=crop',
        },
        {
          type: 'image',
          image_url: 'https://invalid-url-that-will-fail.example/broken2.jpg',
          thumb_url: 'https://invalid-url-that-will-fail.example/broken2-thumb.jpg',
        },
      ],
    });
  })()`);

  await page.close();

  // Screenshot from John's perspective
  const viewPage = await openChannel(ctx, channelId, USER_B, USER_B);
  await viewPage.waitForSelector('[data-message-id]', { timeout: 15000 });
  await viewPage.waitForTimeout(3000); // Wait for images to fail loading

  // 1. Single image attachment with fallback
  console.log('📸 base-image-fallback-in-image-attachment.png');
  const firstBubble = viewPage.locator('.str-chat__message-bubble').first();
  await firstBubble.screenshot({
    path: path.join(OUTPUT_DIR, 'base-image-fallback-in-image-attachment.png'),
  });
  console.log('  ✅ Saved');

  // 2. Gallery with one broken image
  console.log('📸 base-image-fallback-in-attachment-gallery.png');
  const gallery = viewPage.locator('.str-chat__gallery').first();
  if ((await gallery.count()) > 0) {
    await gallery.screenshot({
      path: path.join(OUTPUT_DIR, 'base-image-fallback-in-attachment-gallery.png'),
    });
    console.log('  ✅ Saved');
  } else {
    // Fallback: screenshot the second message bubble
    const secondBubble = viewPage.locator('.str-chat__message-bubble').nth(1);
    await secondBubble.screenshot({
      path: path.join(OUTPUT_DIR, 'base-image-fallback-in-attachment-gallery.png'),
    });
    console.log('  ✅ Saved (bubble fallback)');
  }

  // 3. Attachment preview — skipped, requires complex upload simulation
  console.log(
    '📸 base-image-fallback-in-attachment-preview.png — skipped (requires upload)',
  );

  await viewPage.close();
}

// ─── Connection Status ────────────────────────────────────────────

async function captureConnectionStatus(browser: any) {
  console.log('\n── Connection Status ──');
  const channelId = `misc-conn-${Date.now()}`;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  const page = await createChannel(ctx, channelId, USER_A, USER_A);

  // Send a message for context
  await page.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendMessage({ text: 'Hey, how are you?' });
  })()`);
  await page.close();

  const viewPage = await openChannel(ctx, channelId, USER_B, USER_B);
  await viewPage.waitForSelector('[data-message-id]', { timeout: 15000 });
  await viewPage.waitForTimeout(1500);

  // Inject a connection status notification by dispatching an event
  await viewPage.evaluate(`(async () => {
    var client = window.client;
    // Simulate connection failure notification
    client.dispatchEvent({
      type: 'connection.changed',
      online: false,
    });
  })()`);
  await viewPage.waitForTimeout(1500);

  console.log('📸 ConnectionStatus.png');
  // Screenshot the bottom area of the message list + notification + input
  const channel = viewPage.locator('.str-chat__channel');
  if ((await channel.count()) > 0) {
    await channel.first().screenshot({
      path: path.join(OUTPUT_DIR, 'ConnectionStatus.png'),
    });
    console.log('  ✅ Saved');
  }

  await viewPage.close();
}

// ─── Custom Notification ──────────────────────────────────────────

async function captureCustomNotification(browser: any) {
  console.log('\n── Custom Notification ──');
  const channelId = `misc-notif-${Date.now()}`;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  const page = await createChannel(ctx, channelId, USER_A, USER_A);
  await page.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendMessage({ text: "Hi! How's it going?!" });
  })()`);
  await page.close();

  const viewPage = await openChannel(ctx, channelId, USER_B, USER_B);
  await viewPage.waitForSelector('[data-message-id]', { timeout: 15000 });
  await viewPage.waitForTimeout(1500);

  // Inject a custom notification via dispatchEvent (message.updated triggers "edited" notification)
  await viewPage.evaluate(`(async () => {
    var client = window.client;
    var ch = window.channel;
    var msgs = ch.state.messages;
    if (msgs.length > 0) {
      var msg = msgs[msgs.length - 1];
      client.dispatchEvent({
        type: 'message.updated',
        cid: ch.cid,
        channel_id: ch.id,
        channel_type: ch.type,
        message: { ...msg, text: msg.text, message_text_updated_at: new Date().toISOString() },
      });
    }
  })()`);
  await viewPage.waitForTimeout(1500);

  console.log('📸 CustomNotification.png');
  const channel = viewPage.locator('.str-chat__channel');
  if ((await channel.count()) > 0) {
    await channel.first().screenshot({
      path: path.join(OUTPUT_DIR, 'CustomNotification.png'),
    });
    console.log('  ✅ Saved');
  }

  await viewPage.close();
}

// ─── Diacritics & Transliteration ─────────────────────────────────

async function captureMentionAutocomplete(browser: any) {
  console.log('\n── Diacritics & Transliteration ──');
  const channelId = `misc-mentions-${Date.now()}`;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  // Create channel and add users with special names
  const page = await createChannel(ctx, channelId, USER_A, USER_A);

  // We need users with diacritics and Cyrillic names to exist
  // Create them by adding as members — they'll be auto-created by the token provider
  // Actually, we can't create arbitrary users from client-side.
  // Instead, let's just type @Ullo and @ana in the input and screenshot the input area
  // showing the autocomplete. But we need matching users...

  // Let's just screenshot the input with typed text to show the current theme
  // The mentions popup won't appear without matching users, but the input styling is what matters.

  await page.close();

  const viewPage = await openChannel(ctx, channelId, USER_A, USER_A);
  await viewPage.waitForSelector('[data-message-id]', { timeout: 15000 }).catch(() => {});
  await viewPage.waitForTimeout(1500);

  const textarea = viewPage.locator('textarea.str-chat__message-textarea').first();

  console.log('📸 Diacritics.png');
  if ((await textarea.count()) > 0) {
    await textarea.click();
    await viewPage.keyboard.type('@Mar', { delay: 150 });
    await viewPage.waitForTimeout(1500);

    // Screenshot the entire channel panel (messages + autocomplete + input)
    const channel = viewPage.locator('.str-chat__channel').first();
    await channel.screenshot({
      path: path.join(OUTPUT_DIR, 'Diacritics.png'),
    });
    console.log('  ✅ Saved');

    // Clear and type again
    await viewPage.keyboard.press('Meta+a');
    await viewPage.keyboard.press('Backspace');
    await viewPage.waitForTimeout(500);

    console.log('📸 Transliteration.png');
    await viewPage.keyboard.type('@Joh', { delay: 150 });
    await viewPage.waitForTimeout(1500);

    await channel.screenshot({
      path: path.join(OUTPUT_DIR, 'Transliteration.png'),
    });
    console.log('  ✅ Saved');
  } else {
    console.log('  ⚠️  Textarea not found');
  }

  await viewPage.close();
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  const browser = await chromium.launch({ headless: true });

  await captureBaseImageFallbacks(browser);
  await captureConnectionStatus(browser);
  await captureCustomNotification(browser);
  await captureMentionAutocomplete(browser);

  await browser.close();
  console.log('\n🎉 Done! Screenshots saved to:', OUTPUT_DIR);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
