/**
 * Seeds the "internal" channel with a realistic two-user conversation + images,
 * then retakes the doc screenshots.
 *
 * Run from the stream-chat-react directory:
 *   node scripts/seed-channel-and-screenshot.mjs
 */

import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.resolve(
  __dirname,
  '../../docs/data/docs/chat-sdk/react/v14/_assets',
);
const TMP_DIR = '/tmp/stream-chat-seed-images';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5175';
const CHANNEL_PARAMS = 'view=chat&channel=internal';
const UI_LOAD_TIMEOUT = 20000;

// Two users for the conversation
const USER_A = 'stream_dev_alice';
const USER_B = 'stream_dev_bob';

// Free avatar photos (Unsplash, small crop)
const USER_AVATARS = {
  [USER_A]: {
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop&crop=face',
    name: 'Alice',
  },
  [USER_B]: {
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=face',
    name: 'Bob',
  },
};

function channelUrl(userId, theme = 'light') {
  const avatar = USER_AVATARS[userId];
  const extra = avatar
    ? `&user_image=${encodeURIComponent(avatar.image)}&user_name=${encodeURIComponent(avatar.name)}`
    : '';
  return `${BASE_URL}/?theme=${theme}&${CHANNEL_PARAMS}&user_id=${userId}${extra}`;
}

// ---------------------------------------------------------------------------
// Minimal pure-Node PNG generator (no extra dependencies)
// ---------------------------------------------------------------------------
function createPNG(width, height, pixels) {
  const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const crcTable = (() => {
    const t = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c;
    }
    return t;
  })();

  function crc32(buf) {
    let c = -1;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >> 0;
  }

  function chunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.concat([typeBuf, data]);
    const crc = crc32(crcBuf);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const crcOut = Buffer.alloc(4);
    crcOut.writeInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcOut]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2; // 8-bit RGB

  const rowBytes = width * 3;
  const raw = Buffer.alloc((1 + rowBytes) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (1 + rowBytes)] = 0;
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = y * (1 + rowBytes) + 1 + x * 3;
      raw[dst] = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
    }
  }

  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function gradientImage(w, h, r1, g1, b1, r2, g2, b2) {
  const pixels = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
      pixels[i + 3] = 255;
    }
  }
  return createPNG(w, h, pixels);
}

function solidColorImage(w, h, r, g, b) {
  const pixels = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    pixels[i * 4] = r;
    pixels[i * 4 + 1] = g;
    pixels[i * 4 + 2] = b;
    pixels[i * 4 + 3] = 255;
  }
  return createPNG(w, h, pixels);
}

function checkerImage(w, h, r, g, b) {
  const pixels = new Uint8Array(w * h * 4);
  const sz = Math.max(1, Math.floor(w / 8));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const on = (Math.floor(x / sz) + Math.floor(y / sz)) % 2 === 0;
      const i = (y * w + x) * 4;
      pixels[i] = on ? r : 240;
      pixels[i + 1] = on ? g : 240;
      pixels[i + 2] = on ? b : 240;
      pixels[i + 3] = 255;
    }
  }
  return createPNG(w, h, pixels);
}

function saveImages() {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
  const images = [
    {
      name: 'photo-mountains.png',
      buf: gradientImage(800, 500, 70, 130, 180, 140, 200, 100),
    },
    { name: 'photo-sunset.png', buf: gradientImage(800, 500, 220, 80, 20, 240, 170, 40) },
    { name: 'photo-ocean.png', buf: gradientImage(800, 500, 30, 120, 200, 80, 200, 230) },
    { name: 'photo-forest.png', buf: solidColorImage(800, 500, 60, 120, 60) },
    { name: 'photo-pattern.png', buf: checkerImage(800, 500, 90, 60, 180) },
  ];
  for (const { name, buf } of images) fs.writeFileSync(path.join(TMP_DIR, name), buf);
  return Object.fromEntries(images.map(({ name }) => [name, path.join(TMP_DIR, name)]));
}

// ---------------------------------------------------------------------------
// Conversation script  (user: 'a' | 'b', text, optional images, optional reactions)
// reactions: array of emoji strings that the *other* user will add after the message lands
// ---------------------------------------------------------------------------
// reactions must be from the quick-reaction set: 😂 👍 ❤️ 😔 😮 🔥
const CONVERSATION = [
  {
    user: 'a',
    text: 'Hey team 👋 just pushed the redesign branch — would love some eyes on it',
    reactions: ['😮', '🔥'],
  },
  {
    user: 'b',
    text: 'On it! First impression is really solid. Love the new header',
    reactions: ['❤️'],
  },
  {
    user: 'a',
    text: "Thanks! Here's a side-by-side of the old vs new layout",
    images: ['photo-mountains.png'],
    reactions: ['🔥'],
  },
  {
    user: 'b',
    text: 'Wow, the spacing improvement is huge. One thing — the mobile breakpoint looks a bit cramped',
  },
  {
    user: 'a',
    text: "Good catch. I was playing with a warmer background too, here's a mock",
    images: ['photo-sunset.png'],
    reactions: ['😂'],
  },
  {
    user: 'b',
    text: 'That warmth really works 🎨 Can we see it next to the ocean palette as well?',
    reactions: ['👍'],
  },
  {
    user: 'a',
    text: 'Sure, here are both side by side',
    images: ['photo-ocean.png', 'photo-pattern.png'],
  },
  {
    user: 'b',
    text: 'Ocean variant all the way. The contrast on the action buttons is much better 👍',
    reactions: ['❤️'],
  },
  {
    user: 'a',
    text: "Agreed! I'll update the design tokens and cut a new build tonight",
  },
  {
    user: 'b',
    text: 'Perfect. Also dropping the reference photo the designer shared',
    images: ['photo-forest.png'],
    reactions: ['🔥'],
  },
  { user: 'a', text: "That's exactly the vibe. Let's go with it 🚀", reactions: ['👍'] },
  { user: 'b', text: 'Design team signed off too ✅ Marking this sprint item as done!' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function waitForChatUI(page) {
  await page.waitForSelector('.str-chat__channel-list', { timeout: UI_LOAD_TIMEOUT });
  await page.waitForSelector('.str-chat__message-list', { timeout: UI_LOAD_TIMEOUT });
  await page.waitForTimeout(1500);
}

async function sendMessage(page, text, imagePaths = []) {
  if (imagePaths.length > 0) {
    const fileInput = page.locator('.str-chat__file-input').first();
    await fileInput.setInputFiles(imagePaths);
    await page.waitForTimeout(2000);
  }
  const textarea = page.locator('.str-chat__message-textarea').first();
  await textarea.click();
  await textarea.fill(text);
  await page.waitForTimeout(200);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);
}

// Map emoji characters to the SDK's reaction data-text values
const EMOJI_TO_REACTION = {
  '😂': 'haha',
  '👍': 'like',
  '❤️': 'love',
  '😔': 'sad',
  '😮': 'wow',
  '🔥': 'fire',
};

// Add an emoji reaction to the most recently visible message on the page.
// `emoji` should be one of: 😂 👍 ❤️ 😔 😮 🔥 (the quick-reaction set)
// OR any emoji — will fall back to a random quick-reaction if not in the set.
async function addReactionToLastMessage(page, emoji) {
  const messages = page.locator('.str-chat__li');
  const count = await messages.count();
  if (count === 0) return;

  // Dismiss any lingering overlay/picker from a previous reaction
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  // Click away from messages to clear hover state and overlays
  await page.mouse.click(10, 10);
  await page.waitForTimeout(200);

  const lastMsg = messages.nth(count - 1);
  await lastMsg.hover();
  await page.waitForTimeout(300);

  // Click the reaction (smiley) button in the message toolbar
  const reactionBtn = page.locator('.str-chat__message-reactions-button').last();
  if (!(await reactionBtn.isVisible({ timeout: 1000 }).catch(() => false))) return;
  await reactionBtn.click();
  await page.waitForTimeout(500);

  // Find the matching quick-reaction button by data-text attribute
  const dataText = EMOJI_TO_REACTION[emoji];
  if (dataText) {
    const btn = page
      .locator(`.str-chat__reaction-selector-list__item-button[data-text="${dataText}"]`)
      .first();
    if (await btn.isVisible({ timeout: 800 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(600);
      return;
    }
  }

  // Fallback: if emoji not in quick-reactions, click the "+" to open the full picker
  const plusBtn = page
    .locator('.str-chat__reaction-selector .str-chat__button--circular')
    .last();
  if (await plusBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await plusBtn.click();
    await page.waitForTimeout(500);
    const picker = page.locator('em-emoji-picker').last();
    if (await picker.isVisible({ timeout: 800 }).catch(() => false)) {
      const searchInput = picker.locator('input[type="search"]').first();
      if (await searchInput.isVisible({ timeout: 500 }).catch(() => false)) {
        await searchInput.fill(emoji);
        await page.waitForTimeout(400);
        // Click the first search result
        const firstResult = picker.locator('button[data-index]').first();
        if (await firstResult.isVisible({ timeout: 500 }).catch(() => false)) {
          await firstResult.click();
          await page.waitForTimeout(600);
          return;
        }
      }
    }
  }

  // Last resort: dismiss and skip
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}

// ---------------------------------------------------------------------------
// CSS overrides — each block mirrors a code example in 01-themingv2.md
// ---------------------------------------------------------------------------

// Docs §"Global variables" (lines 72–89)
// Screenshot: stream-chat-css-chat-ui-theme-customization-screenshot.png
const CSS_GLOBAL_VARS = `
@layer stream-overrides {
  .str-chat {
    --brand-50: #edf7f7;
    --brand-100: #e0f2f1;
    --brand-150: #b2dfdb;
    --brand-200: #80cbc4;
    --brand-300: #4db6ac;
    --brand-400: #26a69a;
    --brand-500: #009688;
    --brand-600: #00897b;
    --brand-700: #00796b;
    --brand-800: #00695c;
    --brand-900: #004d40;
    --accent-primary: var(--brand-500);
    --radius-full: 6px;
  }
}`;

// Docs §"Component variables" — avatar (lines 112–133)
// Screenshot: stream-chat-css-custom-avatar-color-screenshot.png
const CSS_AVATAR_COLOR = `
@layer stream-overrides {
  .str-chat {
    --brand-50: #edf7f7;
    --brand-100: #e0f2f1;
    --brand-150: #b2dfdb;
    --brand-200: #80cbc4;
    --brand-300: #4db6ac;
    --brand-400: #26a69a;
    --brand-500: #009688;
    --brand-600: #00897b;
    --brand-700: #00796b;
    --brand-800: #00695c;
    --brand-900: #004d40;
    --accent-primary: var(--brand-500);
    --radius-full: 6px;
    --avatar-palette-bg-1: #bf360c;
    --avatar-palette-text-1: #ffffff;
  }
}`;

// Docs §"Component variables" — message bubble color (lines 148–169)
// Screenshot: stream-chat-css-message-color-customization-screenshot.png
const CSS_MESSAGE_BUBBLE = `
@layer stream-overrides {
  .str-chat {
    --brand-50: #edf7f7;
    --brand-100: #e0f2f1;
    --brand-150: #b2dfdb;
    --brand-200: #80cbc4;
    --brand-300: #4db6ac;
    --brand-400: #26a69a;
    --brand-500: #009688;
    --brand-600: #00897b;
    --brand-700: #00796b;
    --brand-800: #00695c;
    --brand-900: #004d40;
    --accent-primary: var(--brand-500);
    --radius-full: 6px;
    --avatar-palette-bg-1: #bf360c;
    --avatar-palette-text-1: #ffffff;
    --str-chat__message-bubble-color: #00695c;
  }
}`;

// Docs §"Component variables" — bubble + card attachment (lines 178–200)
// Screenshot: stream-chat-css-message-color-customization2-screenshot.png
const CSS_MESSAGE_BUBBLE_AND_CARD = `
@layer stream-overrides {
  .str-chat {
    --brand-50: #edf7f7;
    --brand-100: #e0f2f1;
    --brand-150: #b2dfdb;
    --brand-200: #80cbc4;
    --brand-300: #4db6ac;
    --brand-400: #26a69a;
    --brand-500: #009688;
    --brand-600: #00897b;
    --brand-700: #00796b;
    --brand-800: #00695c;
    --brand-900: #004d40;
    --accent-primary: var(--brand-500);
    --radius-full: 6px;
    --avatar-palette-bg-1: #bf360c;
    --avatar-palette-text-1: #ffffff;
    --str-chat__message-bubble-color: #00695c;
    --str-chat__card-attachment-color: #00695c;
  }
}`;

// Docs §"Dark and light themes" — custom dark (lines 373–404)
// Screenshot: stream-chat-css-custom-dark-theme-screenshot.png
const CSS_CUSTOM_DARK = `
@layer stream-overrides {
  .str-chat {
    --radius-full: 6px;
  }
  .str-chat__theme-light {
    --brand-500: #009688;
    --brand-400: #26a69a;
    --brand-300: #4db6ac;
    --brand-200: #80cbc4;
    --brand-150: #b2dfdb;
    --brand-100: #e0f2f1;
    --brand-50: #edf7f7;
    --accent-primary: var(--brand-500);
    --avatar-palette-bg-1: #bf360c;
    --avatar-palette-text-1: #ffffff;
  }
  .str-chat__theme-dark {
    --brand-500: #26a69a;
    --brand-400: #4db6ac;
    --brand-300: #80cbc4;
    --brand-200: #b2dfdb;
    --brand-150: #e0f2f1;
    --brand-100: #00796b;
    --brand-50: #004d40;
    --accent-primary: var(--brand-400);
    --avatar-palette-bg-1: #ff7043;
    --avatar-palette-text-1: #ffffff;
  }
}`;

// Helper: open a page, optionally inject raw CSS
async function openWithCSS(browser, url, css) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(url);
  await waitForChatUI(page);
  if (css) {
    await page.addStyleTag({ content: css });
    await page.waitForTimeout(400);
  }
  return page;
}

async function screenshot(page, filename) {
  await page.screenshot({ path: path.join(ASSETS_DIR, filename) });
  console.log(`  ✓ ${filename}`);
}

async function takeScreenshots(browser) {
  // ------- Default light theme -------
  console.log('\n--- Default (light) screenshots ---');
  {
    const page = await openWithCSS(browser, channelUrl(USER_A, 'light'));

    await screenshot(page, 'stream-chat-css-chat-ui-screenshot.png');
    await page
      .locator('.str-chat__channel-list')
      .first()
      .screenshot({ path: path.join(ASSETS_DIR, 'default-channel-list.png') });
    console.log('  ✓ default-channel-list.png');
    await page
      .locator('.str-chat__channel-header')
      .first()
      .screenshot({ path: path.join(ASSETS_DIR, 'default-channel-header.png') });
    console.log('  ✓ default-channel-header.png');
    await page
      .locator('.str-chat__message-list')
      .first()
      .screenshot({ path: path.join(ASSETS_DIR, 'default-message-list.png') });
    console.log('  ✓ default-message-list.png');
    await page
      .locator('.str-chat__message-composer-container')
      .first()
      .screenshot({ path: path.join(ASSETS_DIR, 'default-message-input.png') });
    console.log('  ✓ default-message-input.png');

    // Emoji picker (may get detached during re-renders, so wrap in try-catch)
    try {
      const emojiBtn = page.locator('.str-chat__emoji-picker-button').first();
      if (await emojiBtn.isVisible()) {
        await emojiBtn.click();
        await page.waitForTimeout(1000);
        const picker = page.locator('em-emoji-picker').first();
        if (await picker.isVisible()) {
          await picker.screenshot({
            path: path.join(ASSETS_DIR, 'default-emoji-picker.png'),
          });
          console.log('  ✓ default-emoji-picker.png');
        }
        await page.keyboard.press('Escape');
      }
    } catch (e) {
      console.warn('  ⚠ Emoji picker screenshot failed:', e.message.substring(0, 60));
    }

    await page.close();
  }

  // ------- Default dark theme -------
  console.log('\n--- Default dark theme ---');
  {
    const page = await openWithCSS(browser, channelUrl(USER_A, 'dark'));
    await screenshot(page, 'stream-chat-css-dark-ui-screenshot.png');
    await page.close();
  }

  // ------- Docs §"Global variables": teal brand palette + square radius -------
  console.log('\n--- Theming guide screenshots ---');
  {
    const page = await openWithCSS(browser, channelUrl(USER_A, 'light'), CSS_GLOBAL_VARS);
    await screenshot(page, 'stream-chat-css-chat-ui-theme-customization-screenshot.png');
    await page.close();
  }

  // ------- Docs §"Component variables": message color before override -------
  // Same as global vars — shows message text without custom bubble color
  {
    const page = await openWithCSS(browser, channelUrl(USER_A, 'light'), CSS_GLOBAL_VARS);
    await screenshot(page, 'stream-chat-css-message-color-screenshot.png');
    await page.close();
  }

  // ------- Docs §"Component variables": avatar color override -------
  {
    const page = await openWithCSS(
      browser,
      channelUrl(USER_A, 'light'),
      CSS_AVATAR_COLOR,
    );
    await screenshot(page, 'stream-chat-css-custom-avatar-color-screenshot.png');
    await page.close();
  }

  // ------- Docs §"Component variables": message bubble text color -------
  {
    const page = await openWithCSS(
      browser,
      channelUrl(USER_A, 'light'),
      CSS_MESSAGE_BUBBLE,
    );
    await screenshot(page, 'stream-chat-css-message-color-customization-screenshot.png');
    await page.close();
  }

  // ------- Docs §"Component variables": bubble + card attachment text color -------
  {
    const page = await openWithCSS(
      browser,
      channelUrl(USER_A, 'light'),
      CSS_MESSAGE_BUBBLE_AND_CARD,
    );
    await screenshot(page, 'stream-chat-css-message-color-customization2-screenshot.png');
    await page.close();
  }

  // ------- Docs §"Dark and light themes": custom dark + light overrides -------
  // Uses dark theme URL; CSS targets .str-chat__theme-dark specifically
  {
    const page = await openWithCSS(browser, channelUrl(USER_A, 'dark'), CSS_CUSTOM_DARK);
    await screenshot(page, 'stream-chat-css-custom-dark-theme-screenshot.png');
    await page.close();
  }

  // ------- Docs §"Creating your own theme": round + square themes -------
  // The docs show customClasses with square on channelList and round on channel.
  // CSS variable overrides via layers don't visually apply due to cascade priority,
  // so we apply border-radius via inline styles on the avatar elements directly.
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(channelUrl(USER_A, 'light'));
    await waitForChatUI(page);
    // Square avatars in channel list (6px), round in channel (default 9999px)
    await page.evaluate(() => {
      document
        .querySelectorAll('.str-chat__channel-list .str-chat__avatar')
        .forEach((el) => {
          el.style.setProperty('border-radius', '6px', 'important');
        });
    });
    await page.waitForTimeout(400);
    await screenshot(page, 'stream-chat-css-square-theme-screenshot.png');
    await page.close();
  }

  // ------- Docs §"RTL support" -------
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(channelUrl(USER_A, 'light'));
    await waitForChatUI(page);
    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
    await page.waitForTimeout(500);
    await screenshot(page, 'stream-chat-css-rtl-layout-screenshot.png');
    await page.close();
  }

  // ------- Docs §"Apply your own look and feel": layout-only -------
  console.log('\n--- Layout-only screenshot ---');
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(channelUrl(USER_A, 'light'));
    await waitForChatUI(page);
    // Simulate importing only index.layout.scss by stripping all visual theming
    await page.addStyleTag({
      content: [
        '.str-chat, .str-chat * { box-shadow: none !important; text-shadow: none !important; }',
        '.str-chat { color: #000 !important; background: #fff !important; }',
      ].join('\n'),
    });
    await page.evaluate(() => {
      const stripped = {
        '--str-chat__primary-color': 'transparent',
        '--str-chat__active-primary-color': 'transparent',
        '--str-chat__surface-color': 'transparent',
        '--str-chat__secondary-surface-color': 'transparent',
        '--str-chat__primary-surface-color': 'transparent',
        '--str-chat__primary-surface-color-low-emphasis': 'transparent',
        '--str-chat__border-radius-circle': '0',
        '--str-chat__font-family': 'inherit',
      };
      document.querySelectorAll('.str-chat').forEach((el) => {
        for (const [k, v] of Object.entries(stripped)) {
          el.style.setProperty(k, v, 'important');
        }
      });
    });
    await page.waitForTimeout(400);
    await screenshot(page, 'stream-chat-css-chat-ui-layout-screenshot.png');
    await page.close();
  }

  // ------- Thread -------
  console.log('\n--- Thread screenshot ---');
  {
    const page = await openWithCSS(browser, channelUrl(USER_A, 'light'));

    const clicked = await page.evaluate(() => {
      const btn = document.querySelector('.str-chat__message-reply-in-thread-button');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    let threadOpened = false;
    if (clicked) {
      await page.waitForTimeout(1200);
      const thread = page.locator('.str-chat__dropzone-root--thread').first();
      if (await thread.isVisible({ timeout: 3000 }).catch(() => false)) {
        const threadTextarea = thread.locator('.str-chat__message-textarea').first();
        await threadTextarea.click();
        await threadTextarea.fill('Totally agree, that layout change is 🔥');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        await thread.screenshot({ path: path.join(ASSETS_DIR, 'default-thread.png') });
        console.log('  ✓ default-thread.png');
        threadOpened = true;
      }
    }
    if (!threadOpened) console.warn('  ⚠ Could not open thread, skipping');
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const SKIP_SEED = process.argv.includes('--skip-seed');

async function run() {
  if (SKIP_SEED) {
    console.log('Skipping seed (--skip-seed), taking screenshots only...');
  } else {
    console.log('Generating sample images...');
  }
  const imagesByName = SKIP_SEED ? {} : saveImages();
  if (!SKIP_SEED)
    console.log(`  ✓ ${Object.keys(imagesByName).length} images written to ${TMP_DIR}`);

  const browser = await chromium.launch({ headless: false });
  try {
    // -----------------------------------------------------------------------
    // Step 1: Seed with two users conversing
    // -----------------------------------------------------------------------
    if (!SKIP_SEED) {
      console.log(`\nSeeding "internal" channel as ${USER_A} and ${USER_B}...`);

      const ctxA = await browser.newContext();
      const ctxB = await browser.newContext();
      const pageA = await ctxA.newPage();
      const pageB = await ctxB.newPage();
      await pageA.setViewportSize({ width: 1280, height: 900 });
      await pageB.setViewportSize({ width: 1280, height: 900 });

      console.log(`  Loading ${USER_A}...`);
      await pageA.goto(channelUrl(USER_A));
      await waitForChatUI(pageA);

      console.log(`  Loading ${USER_B}...`);
      await pageB.goto(channelUrl(USER_B));
      await waitForChatUI(pageB);

      console.log('  Sending conversation...');
      for (const msg of CONVERSATION) {
        const senderPage = msg.user === 'a' ? pageA : pageB;
        const reactorPage = msg.user === 'a' ? pageB : pageA;
        const imagePaths = (msg.images || []).map((n) => imagesByName[n]);
        await sendMessage(senderPage, msg.text, imagePaths);
        process.stdout.write(
          `  [${msg.user === 'a' ? USER_A : USER_B}] ${msg.text.substring(0, 50)}\n`,
        );

        if (msg.reactions?.length) {
          await reactorPage.waitForTimeout(600);
          for (const emoji of msg.reactions) {
            await addReactionToLastMessage(reactorPage, emoji);
            process.stdout.write(`    ↳ reacted ${emoji}\n`);
          }
        }
      }

      console.log('\n  ✓ Conversation seeded');
      await pageA.waitForTimeout(1500);
      await ctxA.close();
      await ctxB.close();
    }

    // -----------------------------------------------------------------------
    // Ensure both users' profiles (name + image) are synced to the server
    // by briefly loading a page for each user with their avatar URL params.
    // -----------------------------------------------------------------------
    console.log('\nSyncing user profiles (avatars) and channel images...');
    {
      const ctx = await browser.newContext();
      // Connect both users to sync their profiles
      for (const userId of [USER_A, USER_B]) {
        const page = await ctx.newPage();
        await page.setViewportSize({ width: 800, height: 600 });
        await page.goto(channelUrl(userId, 'light'));
        await page.waitForSelector('.str-chat__channel-list', {
          timeout: UI_LOAD_TIMEOUT,
        });
        await page.waitForTimeout(1500);
        console.log(`  ✓ ${userId} profile synced`);

        // On Alice's page, also update channel images via the API
        if (userId === USER_A) {
          const updated = await page.evaluate(async () => {
            const el = document.querySelector('.str-chat__channel');
            if (!el) return [];
            const key = Object.keys(el).find((k) => k.startsWith('__reactFiber'));
            let fiber = el[key];
            let client = null;
            while (fiber) {
              if (fiber.memoizedProps?.client?.channel) {
                client = fiber.memoizedProps.client;
                break;
              }
              fiber = fiber.return;
            }
            if (!client) return ['no client'];

            // Channel images — free Unsplash photos (128x128 crops)
            const channelImages = {
              internal: {
                image:
                  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=128&h=128&fit=crop',
              },
              general: {
                image:
                  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=128&h=128&fit=crop',
              },
              bugs: {
                image:
                  'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=128&h=128&fit=crop',
              },
              backend: {
                image:
                  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=128&h=128&fit=crop',
              },
              security: {
                image:
                  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=128&h=128&fit=crop',
              },
              praises: {
                image:
                  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=128&h=128&fit=crop',
              },
              random: {
                image:
                  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=128&h=128&fit=crop',
              },
            };

            const results = [];
            for (const [channelId, data] of Object.entries(channelImages)) {
              try {
                const ch = client.channel('public', channelId);
                await ch.updatePartial({ set: { image: data.image } });
                results.push(channelId + ': ok');
              } catch (e) {
                // Try messaging type too
                try {
                  const ch = client.channel('messaging', channelId);
                  await ch.updatePartial({ set: { image: data.image } });
                  results.push(channelId + ': ok (messaging)');
                } catch (e2) {
                  results.push(channelId + ': ' + e.message?.substring(0, 60));
                }
              }
            }
            return results;
          });
          console.log('  Channel images:', updated);
        }

        await page.close();
      }
      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // Take screenshots as USER_A (sees their own messages on the right)
    // -----------------------------------------------------------------------
    await takeScreenshots(browser);

    console.log(`\n✅ Done! Screenshots saved to:\n   ${ASSETS_DIR}`);
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
