/**
 * Playwright script to capture screenshots for the Voice Recording docs.
 *
 * Usage:
 *   npx tsx examples/vite/screenshot-voice-recording.ts
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
const CHANNEL_ID = `cookbook-voice-rec-${Date.now()}`;
const USER_A = 'Marco';
const USER_B = 'John';
const OUTPUT_DIR = path.resolve(
  __dirname,
  '../../../docs/data/docs/chat-sdk/react/v14/_assets',
);

// Sample waveform data (fractional values 0-1)
const WAVEFORM_DATA = JSON.stringify(
  Array.from({ length: 100 }, (_, i) =>
    Math.abs(Math.sin((i / 100) * Math.PI * 4) * 0.8 + Math.random() * 0.2),
  ),
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
        name: 'Voice Recording Demo',
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
  console.log('🌱 Seeding channel with voice recordings...');

  const pageA = await initSession(contextA, USER_A, USER_A, true);
  const pageB = await initSession(contextB, USER_B, USER_B);

  // 1. Normal voice recording (full data) — for voice-recording-player.png
  await pageA.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendMessage({
      text: '',
      attachments: [{
        type: 'voiceRecording',
        title: 'audio_recording_2026-03-18.aac',
        asset_url: 'https://us-east.stream-io-cdn.com/fake-voice-recording.aac',
        mime_type: 'audio/aac',
        file_size: 21342,
        duration: 5.2,
        waveform_data: ${WAVEFORM_DATA},
      }],
    });
  })()`);

  // 2. Voice recording for quoted reply — for voice-recording-quoted.png
  // First send a message with voice recording from user B
  const r2: any = await pageB.evaluate(`(async () => {
    var ch = window.channel;
    var m = await ch.sendMessage({
      text: '',
      attachments: [{
        type: 'voiceRecording',
        title: 'audio_recording_2026-03-18.aac',
        asset_url: 'https://us-east.stream-io-cdn.com/fake-voice-recording-2.aac',
        mime_type: 'audio/aac',
        file_size: 68421,
        duration: 44,
        waveform_data: ${WAVEFORM_DATA},
      }],
    });
    return { id: m.message.id };
  })()`);

  // Then quote-reply it
  await pageA.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendMessage({
      text: 'Nice voice message!',
      quoted_message_id: ${JSON.stringify(r2.id)},
    });
  })()`);

  // 3. Voice recording with full waveform + file icon (for navigation/stopped screenshots)
  await pageB.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendMessage({
      text: '',
      attachments: [{
        type: 'voiceRecording',
        title: 'voice_message_demo.aac',
        asset_url: 'https://us-east.stream-io-cdn.com/fake-voice-recording-3.aac',
        mime_type: 'audio/aac',
        file_size: 21342,
        duration: 7.5,
        waveform_data: ${WAVEFORM_DATA},
      }],
    });
  })()`);

  // 4. Voice recording WITHOUT duration (file size fallback)
  await pageA.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendMessage({
      text: '',
      attachments: [{
        type: 'voiceRecording',
        title: 'voice_message_no_duration.aac',
        asset_url: 'https://us-east.stream-io-cdn.com/fake-voice-recording-4.aac',
        mime_type: 'audio/aac',
        file_size: 21342,
        waveform_data: ${WAVEFORM_DATA},
      }],
    });
  })()`);

  // 5. Voice recording WITHOUT title (fallback title)
  await pageB.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendMessage({
      text: '',
      attachments: [{
        type: 'voiceRecording',
        asset_url: 'https://us-east.stream-io-cdn.com/fake-voice-recording-5.aac',
        mime_type: 'audio/aac',
        file_size: 15000,
        duration: 7.2,
        waveform_data: ${WAVEFORM_DATA},
      }],
    });
  })()`);

  // 6. Voice recording for quoted reply WITHOUT title
  const r6: any = await pageA.evaluate(`(async () => {
    var ch = window.channel;
    var m = await ch.sendMessage({
      text: '',
      attachments: [{
        type: 'voiceRecording',
        asset_url: 'https://us-east.stream-io-cdn.com/fake-voice-recording-6.aac',
        mime_type: 'audio/aac',
        file_size: 68421,
        duration: 44,
        waveform_data: ${WAVEFORM_DATA},
      }],
    });
    return { id: m.message.id };
  })()`);

  // Quote the no-title message
  await pageB.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendMessage({
      text: 'Replying to voice message',
      quoted_message_id: ${JSON.stringify(r6.id)},
    });
  })()`);

  // 7. Voice recording for quoted reply WITHOUT duration (file size fallback)
  const r7: any = await pageB.evaluate(`(async () => {
    var ch = window.channel;
    var m = await ch.sendMessage({
      text: '',
      attachments: [{
        type: 'voiceRecording',
        title: 'audio_recording_no_dur.aac',
        asset_url: 'https://us-east.stream-io-cdn.com/fake-voice-recording-7.aac',
        mime_type: 'audio/aac',
        file_size: 68421,
        waveform_data: ${WAVEFORM_DATA},
      }],
    });
    return { id: m.message.id };
  })()`);

  await pageA.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendMessage({
      text: 'Got it!',
      quoted_message_id: ${JSON.stringify(r7.id)},
    });
  })()`);

  // 8. Voice recording WITHOUT waveform_data (empty waveform)
  await pageB.evaluate(`(async () => {
    var ch = window.channel;
    await ch.sendMessage({
      text: '',
      attachments: [{
        type: 'voiceRecording',
        title: 'voice_message_no_waveform.aac',
        asset_url: 'https://us-east.stream-io-cdn.com/fake-voice-recording-8.aac',
        mime_type: 'audio/aac',
        file_size: 21342,
        duration: 7.0,
        waveform_data: [],
      }],
    });
  })()`);

  console.log('  ✅ Channel seeded');
  await pageA.close();
  await pageB.close();
}

// ─── Screenshot helpers ───────────────────────────────────────────

async function screenshotElement(page: Page, selector: string, outputPath: string) {
  const el = page.locator(selector);
  if ((await el.count()) > 0) {
    await el.first().screenshot({ path: outputPath });
    return true;
  }
  return false;
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  const browser = await chromium.launch({ headless: true });

  const contextA = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const contextB = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  await seedChannel(contextA, contextB);

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  const url = `${BASE_URL}/?theme=light&view=chat&channel=${CHANNEL_ID}&user_id=${USER_B}&user_name=${USER_B}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-message-id]', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Get all voice recording players and quoted recordings
  const players = page.locator('.str-chat__message-attachment__voice-recording-widget');
  const playerCount = await players.count();
  console.log(`Found ${playerCount} voice recording players`);

  const quotedRecordings = page.locator('.str-chat__quoted-message-preview');
  const quotedCount = await quotedRecordings.count();
  console.log(`Found ${quotedCount} quoted messages`);

  // 1. voice-recording-player.png — first player (normal, full data)
  console.log('📸 voice-recording-player.png');
  if (playerCount > 0) {
    await players.nth(0).screenshot({
      path: path.join(OUTPUT_DIR, 'voice-recording-player.png'),
    });
    console.log('  ✅ Saved');
  }

  // 2. voice-recording-quoted.png — the whole message bubble containing the quoted voice recording
  console.log('📸 voice-recording-quoted.png');
  const quotedBubbles = page.locator(
    '.str-chat__message-bubble:has(.str-chat__quoted-message-preview)',
  );
  if ((await quotedBubbles.count()) > 0) {
    await quotedBubbles.first().screenshot({
      path: path.join(OUTPUT_DIR, 'voice-recording-quoted.png'),
    });
    console.log('  ✅ Saved');
  }

  // 3. voice-recording-player-stopped-repro.png — player with seek position
  // We use the 3rd player (index 2, from message 3)
  console.log('📸 voice-recording-player-stopped-repro.png');
  if (playerCount > 2) {
    await players.nth(2).screenshot({
      path: path.join(OUTPUT_DIR, 'voice-recording-player-stopped-repro.png'),
    });
    console.log('  ✅ Saved');
  }

  // 4. voice-recording-player-file-size-fallback.png — player without duration
  console.log('📸 voice-recording-player-file-size-fallback.png');
  if (playerCount > 3) {
    await players.nth(3).screenshot({
      path: path.join(OUTPUT_DIR, 'voice-recording-player-file-size-fallback.png'),
    });
    console.log('  ✅ Saved');
  }

  // 5. voice-recording-fallback-title.png — player without title
  console.log('📸 voice-recording-fallback-title.png');
  if (playerCount > 4) {
    await players.nth(4).screenshot({
      path: path.join(OUTPUT_DIR, 'voice-recording-fallback-title.png'),
    });
    console.log('  ✅ Saved');
  }

  // 6. voice-recording-quoted-fallback-title.png — quoted voice recording without title (2nd quoted bubble)
  console.log('📸 voice-recording-quoted-fallback-title.png');
  if ((await quotedBubbles.count()) > 1) {
    await quotedBubbles.nth(1).screenshot({
      path: path.join(OUTPUT_DIR, 'voice-recording-quoted-fallback-title.png'),
    });
    console.log('  ✅ Saved');
  }

  // 7. voice-recording-quoted-file-size-fallback.png — quoted without duration (3rd quoted bubble)
  console.log('📸 voice-recording-quoted-file-size-fallback.png');
  if ((await quotedBubbles.count()) > 2) {
    await quotedBubbles.nth(2).screenshot({
      path: path.join(OUTPUT_DIR, 'voice-recording-quoted-file-size-fallback.png'),
    });
    console.log('  ✅ Saved');
  }

  // 8. voice-recording-empty-waveform-data.png — player without waveform
  console.log('📸 voice-recording-empty-waveform-data.png');
  if (playerCount > 5) {
    // The last player should be the one without waveform
    await players.last().screenshot({
      path: path.join(OUTPUT_DIR, 'voice-recording-empty-waveform-data.png'),
    });
    console.log('  ✅ Saved');
  }

  // 9. voice-recording-player-in-progress.png — same as player but conceptually "playing"
  // We can't actually play audio in headless, so just reuse a player screenshot
  console.log('📸 voice-recording-player-in-progress.png');
  if (playerCount > 2) {
    await players.nth(2).screenshot({
      path: path.join(OUTPUT_DIR, 'voice-recording-player-in-progress.png'),
    });
    console.log('  ✅ Saved');
  }

  await browser.close();
  console.log('\n🎉 Done! Screenshots saved to:', OUTPUT_DIR);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
