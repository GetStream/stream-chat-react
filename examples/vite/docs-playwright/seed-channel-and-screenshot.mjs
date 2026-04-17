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

import {
  variants as themingVariants,
  baselineVariants,
  rtlVariant,
} from './theming-variants.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Target the docs-content tree used by the published React SDK docs.
// Path anchor: `../../../../docs` resolves from
//   stream-chat-sdks/stream-chat-react/examples/vite/docs-playwright/
// to
//   stream-chat-sdks/docs/
// i.e. the sibling `docs` repo / submodule on the host workspace.
const ASSETS_DIR =
  process.env.ASSETS_DIR ||
  path.resolve(__dirname, '../../../../docs/data/docs/chat-sdk/react/v14-latest/_assets');
const TMP_DIR = '/tmp/stream-chat-seed-images';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5175';
// Dedicated channel + users for the theming doc captures, kept separate from
// any live demo channels so regenerating screenshots stays deterministic.
const CHANNEL_ID = process.env.DOC_CHANNEL_ID || 'theming-docs-v14';
const CHANNEL_PARAMS = `view=chat&channel=${CHANNEL_ID}`;
const UI_LOAD_TIMEOUT = 20000;

// Viewport used for every captured screenshot. 1280×1200 at deviceScaleFactor
// 1 yields 1280×1200 PNGs — taller frame so more of the conversation is
// visible without relying on retina scaling.
const CAPTURE_VIEWPORT = { width: 1280, height: 1200 };
const CAPTURE_DPR = 1;

// Two users scoped to the docs capture harness.
const USER_A = 'docs_v14_alice';
const USER_B = 'docs_v14_bob';

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
    text: 'Morning 👋 just pushed the redesign branch — would love eyes on the **new composer** and **channel list**',
    reactions: ['🔥', '❤️'],
  },
  {
    user: 'b',
    text: 'Reviewing now 👀 First impression: the bubble rhythm *finally* feels intentional',
    reactions: ['👍'],
  },
  {
    user: 'a',
    text: "Here's a side-by-side — old vs new channel list affordances",
    images: ['photo-mountains.png'],
    reactions: ['😮', '🔥'],
  },
  {
    user: 'b',
    text: 'The spacing improvement is huge 🎯 Are the v14 theme tokens documented anywhere yet?',
  },
  {
    user: 'a',
    text: "Yep, full write-up here → https://getstream.io/chat/docs/sdk/react/theming/themingv2/\n\nTL;DR: override `--accent-primary`, `--chat-bg-outgoing`, `--text-link` and you're 80% of the way there 🎨",
    reactions: ['❤️'],
  },
  {
    user: 'b',
    text: 'Thanks! Also poking at the React SDK repo → https://github.com/GetStream/stream-chat-react',
    reactions: ['👍'],
  },
  {
    user: 'a',
    text: 'Quick mock of the outgoing bubbles against the **new accent** 🎨',
    images: ['photo-sunset.png'],
    reactions: ['🔥'],
  },
  {
    user: 'b',
    text: 'Contrast is *noticeably* better. Type stays legible even at the smaller weight',
  },
  {
    user: 'a',
    text: 'Stacked both brand directions side by side 👇',
    images: ['photo-ocean.png', 'photo-pattern.png'],
  },
  {
    user: 'b',
    text: '**Ocean variant** all the way — the `--border-utility-focused` treatment is really crisp 👌',
    reactions: ['❤️'],
  },
  {
    user: 'a',
    text: "Agreed 🙌 I'll finalize the tokens tonight. Sync tomorrow at **9:30**?",
    reactions: ['👍'],
  },
  {
    user: 'b',
    text: "Works for me — I'll bring the component sweep 📋",
  },
  {
    user: 'a',
    text: 'One more — mood board the design team shared, really captures the vibe ✨',
    images: ['photo-forest.png'],
    reactions: ['🔥', '😮'],
  },
  {
    user: 'b',
    text: "That's exactly it. Let's ship 🚀",
    reactions: ['👍'],
  },
  {
    user: 'a',
    text: 'Thread surface finally matches the composer rhythm — *single source of truth* for `--radius-max` + spacing tokens 🎯',
    reactions: ['❤️'],
  },
  {
    user: 'a',
    text: 'Last thing — dropped the PR for a final pass 🙏 https://github.com/GetStream/stream-chat-react',
    reactions: ['👍'],
  },
  {
    user: 'b',
    text: 'Design team signed off too ✅ marking this sprint item **done** 🎉',
    reactions: ['🔥'],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function waitForChatUI(page) {
  await page.waitForSelector('.str-chat__channel-list', { timeout: UI_LOAD_TIMEOUT });
  await page.waitForSelector('.str-chat__message-list', { timeout: UI_LOAD_TIMEOUT });
  // Wait for at least one rendered message item so the capture doesn't
  // race an empty list during the initial channel query.
  await page
    .waitForSelector('.str-chat__li', { timeout: UI_LOAD_TIMEOUT })
    .catch(() => null);
  await page.waitForTimeout(1500);
}

// Force the message list to the bottom so the most recent exchange (which
// includes both users' most recent bubbles) is visible in the capture
// viewport. Needed because the list only auto-scrolls for messages the
// current user sent — incoming messages arriving while we're in the scripted
// seeding phase can leave the scroll anchored to an older position.
async function scrollToLatest(page) {
  await page.evaluate(() => {
    const container =
      document.querySelector('.str-chat__message-list-scroll') ||
      document.querySelector('.str-chat__message-list');
    if (container) container.scrollTop = container.scrollHeight;
    // Virtualized list variant uses its own inner scroller.
    const virt = document.querySelector('.str-chat__virtual-list');
    if (virt) virt.scrollTop = virt.scrollHeight;
  });
  await page.waitForTimeout(500);
}

// A single retina context is reused for every captured screenshot. Using one
// context (rather than a fresh one per page) lets localStorage, IndexedDB,
// and cached auth tokens persist across captures — otherwise each themed
// capture re-runs the token-fetch flow from scratch and can race the
// message list before it populates.
let _captureContext = null;

async function getCaptureContext(browser) {
  if (!_captureContext) {
    _captureContext = await browser.newContext({
      viewport: CAPTURE_VIEWPORT,
      deviceScaleFactor: CAPTURE_DPR,
    });
  }
  return _captureContext;
}

async function newCapturePage(browser) {
  const ctx = await getCaptureContext(browser);
  return ctx.newPage();
}

async function closeCapturePage(page) {
  await page.close();
}

async function disposeCaptureContext() {
  if (_captureContext) {
    await _captureContext.close();
    _captureContext = null;
  }
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
// CSS overrides mirroring each code example in 01-themingv2.md live in
// `./theming-variants.mjs`. Keep that file and the doc in lockstep.
// ---------------------------------------------------------------------------

// Helper: open a page with the shared capture viewport/DPR, optionally
// inject raw CSS, and scroll to the latest message so both users' most
// recent bubbles are in frame.
async function openWithCSS(browser, url, css) {
  const page = await newCapturePage(browser);
  await page.goto(url);
  await waitForChatUI(page);
  if (css) {
    await page.addStyleTag({ content: css });
    await page.waitForTimeout(400);
  }
  await scrollToLatest(page);
  return page;
}

async function screenshot(page, filename) {
  await page.screenshot({ path: path.join(ASSETS_DIR, filename) });
  console.log(`  ✓ ${filename}`);
}

async function takeScreenshots(browser) {
  // ------- Default light theme (baselines + region crops) -------
  console.log('\n--- Default (light) screenshots ---');
  {
    const page = await openWithCSS(browser, channelUrl(USER_A, 'light'));

    await screenshot(page, 'stream-chat-css-chat-ui-screenshot.png');
    // Region crops used by other doc pages (kept for backwards compatibility).
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

    await closeCapturePage(page);
  }

  // ------- Additional baseline variants from theming-variants.mjs -------
  console.log('\n--- Theming baselines ---');
  for (const v of baselineVariants) {
    if (v.screenshot === 'stream-chat-css-chat-ui-screenshot.png') continue; // already taken above
    const page = await openWithCSS(browser, channelUrl(USER_A, v.theme), v.css);
    await screenshot(page, v.screenshot);
    await closeCapturePage(page);
  }

  // ------- Docs theming examples: drive from theming-variants.mjs -------
  console.log('\n--- Theming guide variants ---');
  for (const v of themingVariants) {
    const page = await openWithCSS(browser, channelUrl(USER_A, v.theme), v.css);
    await screenshot(page, v.screenshot);
    await closeCapturePage(page);
  }

  // ------- Docs §"RTL support" -------
  console.log('\n--- RTL ---');
  {
    const page = await openWithCSS(browser, channelUrl(USER_A, rtlVariant.theme));
    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
    await page.waitForTimeout(500);
    await scrollToLatest(page);
    await screenshot(page, rtlVariant.screenshot);
    await closeCapturePage(page);
  }

  // ------- Thread (utility crop used by other doc pages) -------
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
    await closeCapturePage(page);
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

  const browser = await chromium.launch({
    headless: process.env.HEADED !== '1',
  });
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

      // Explicitly create the channel with both members + a friendly name
      // before either user tries to post. Without this, USER_B lands on a
      // channel they're not a member of and has no composer. Also truncate
      // any prior seed so reruns don't stack duplicate messages.
      console.log(`  Creating channel "${CHANNEL_ID}" with both members...`);
      const createResult = await pageA.evaluate(
        async ({ userA, userB, channelId }) => {
          const findClient = () => {
            const el =
              document.querySelector('.str-chat__channel') ||
              document.querySelector('.str-chat');
            if (!el) return null;
            const key = Object.keys(el).find((k) => k.startsWith('__reactFiber'));
            let fiber = el[key];
            while (fiber) {
              if (fiber.memoizedProps?.client?.channel) return fiber.memoizedProps.client;
              fiber = fiber.return;
            }
            return null;
          };
          const client = findClient();
          if (!client) return { ok: false, reason: 'no client' };
          try {
            const ch = client.channel('messaging', channelId, {
              members: [userA, userB],
              name: 'Design redesign — v14',
            });
            await ch.watch();
            const existingCount = (ch.state.messages || []).length;
            if (existingCount > 0) {
              await ch.truncate();
            }
            return { ok: true, truncated: existingCount };
          } catch (err) {
            return { ok: false, reason: err?.message?.substring(0, 120) || String(err) };
          }
        },
        { userA: USER_A, userB: USER_B, channelId: CHANNEL_ID },
      );
      console.log(
        createResult.ok
          ? `  ✓ channel ready (truncated ${createResult.truncated} prior msg${createResult.truncated === 1 ? '' : 's'})`
          : `  ⚠ channel create: ${createResult.reason}`,
      );

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
    await disposeCaptureContext();
    await browser.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
