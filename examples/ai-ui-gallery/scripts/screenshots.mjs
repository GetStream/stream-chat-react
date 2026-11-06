#!/usr/bin/env node
/**
 * Screenshots every cell of the gallery and checks the contrast of every piece of text in it.
 *
 *   yarn build                                    # at the repo root: the gallery renders dist/
 *   yarn workspace @stream-io/stream-chat-react-ai-ui-gallery dev
 *   yarn workspace @stream-io/stream-chat-react-ai-ui-gallery screenshots [outDir]
 *
 * Each cell is a theme (light, dark), whether the conversation is inside a `.str-chat` element,
 * and whether the app sets only the `--str-chat__ai-*` tokens. Outside `.str-chat` with no app
 * tokens there is no theme to follow (Stream's tokens exist only in `.str-chat`), so that cell is
 * the light fallbacks, once. Text, including what the A2UI
 * elements draw in their shadow roots and the values of inputs, must reach 4.5:1 against what
 * is painted under it. Disabled controls and placeholders are exempt, as WCAG exempts them.
 * Exits non-zero when any text falls short, listing each.
 *
 * Uses the installed Google Chrome (`GALLERY_URL` and `CHROME_CHANNEL` override the defaults).
 */
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const BASE_URL = process.env.GALLERY_URL ?? 'http://localhost:5177/';
const OUT_DIR = resolve(process.argv[2] ?? 'screenshots');
const MIN_CONTRAST = 4.5;

const cells = [];
for (const theme of ['light', 'dark']) {
  for (const wrapper of ['inside', 'outside']) {
    for (const tokens of ['default', 'app']) {
      // Outside `.str-chat` there is no Stream theme, so the fallbacks are the same in both.
      if (wrapper === 'outside' && tokens === 'default' && theme === 'dark') continue;
      cells.push({ theme, tokens, wrapper });
    }
  }
}

// Runs in the page: every text the person reads, with its colour and what is painted under it.
const auditContrast = (minContrast) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  // Any CSS colour (oklab, color-mix results, …) as sRGB bytes, through the canvas.
  const rgba = (color) => {
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = '#000';
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    return { a: a / 255, b, g, r };
  };
  const over = (top, bottom) => ({
    a: 1,
    b: top.b * top.a + bottom.b * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    r: top.r * top.a + bottom.r * (1 - top.a),
  });
  const luminance = ({ b, g, r }) => {
    const channel = (value) => {
      const c = value / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };
  const ratio = (one, two) => {
    const [light, dark] = [luminance(one), luminance(two)].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
  };
  const parentOf = (element) =>
    element.parentElement ??
    (element.getRootNode() instanceof ShadowRoot ? element.getRootNode().host : null);
  // What is painted under an element: its backgrounds and its ancestors', composed.
  const backgroundOf = (element) => {
    const layers = [];
    for (let node = element; node; node = parentOf(node)) {
      const color = rgba(getComputedStyle(node).backgroundColor);
      if (color.a > 0) layers.push(color);
      if (color.a >= 1) break;
    }
    let painted = { a: 1, b: 255, g: 255, r: 255 };
    for (const layer of layers.reverse()) painted = over(layer, painted);
    return painted;
  };
  const isExempt = (element) => {
    for (let node = element; node; node = parentOf(node)) {
      if (node.matches?.(':disabled, [aria-disabled="true"], [aria-hidden="true"]'))
        return true;
    }
    return false;
  };
  const isShown = (element) => {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return (
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      box.width > 0 &&
      box.height > 0 &&
      Number(style.opacity) > 0
    );
  };
  const describe = (element) => {
    const parts = [];
    for (let node = element; node && parts.length < 4; node = parentOf(node)) {
      parts.unshift(
        node.className && typeof node.className === 'string'
          ? `${node.localName}.${node.className.trim().split(/\s+/).join('.')}`
          : node.localName,
      );
    }
    return parts.join(' > ');
  };
  const results = [];
  const check = (element, text) => {
    if (!text || isExempt(element) || !isShown(element)) return;
    const foreground = rgba(getComputedStyle(element).color);
    const background = backgroundOf(element);
    const value = ratio(over(foreground, background), background);
    results.push({
      element: describe(element),
      passes: value >= minContrast,
      ratio: Math.round(value * 100) / 100,
      text: text.slice(0, 60),
    });
  };
  const visit = (root) => {
    for (const element of root.querySelectorAll('*')) {
      if (element.shadowRoot) visit(element.shadowRoot);
      if (element.closest?.('dialog:not([open])')) continue;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)) {
        const value =
          element.tagName === 'SELECT'
            ? element.selectedOptions[0]?.textContent
            : element.value;
        if (!['checkbox', 'radio', 'range', 'hidden'].includes(element.type))
          check(element, value?.trim());
        continue;
      }
      const own = [...element.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent.trim())
        .join(' ')
        .trim();
      check(element, own);
    }
  };
  visit(document.querySelector('.gallery'));
  return results;
};

const browser = await chromium.launch({
  channel: process.env.CHROME_CHANNEL ?? 'chrome',
});
const page = await browser.newPage({ viewport: { height: 900, width: 900 } });
mkdirSync(OUT_DIR, { recursive: true });
let failures = 0;
for (const { theme, tokens, wrapper } of cells) {
  const name = `${theme}-${wrapper}-${tokens}`;
  await page.goto(`${BASE_URL}?theme=${theme}&wrapper=${wrapper}&tokens=${tokens}`);
  await page.waitForSelector('.str-chat__a2ui__surface');
  await page.waitForSelector('.str-chat__openui .openui-card');
  await page.waitForTimeout(1500);
  // The conversation's own scroller holds the turns; let the page grow to show them all. The
  // latest turn is as tall as the scroller, which would then grow with it, so it keeps its own.
  await page.addStyleTag({
    content:
      '.str-chat__ai-conversation, .str-chat__ai-conversation__scroller { height: auto !important; overflow: visible !important; } .str-chat__ai-conversation__turn--latest { min-height: 0 !important; }',
  });
  await page.screenshot({ fullPage: true, path: resolve(OUT_DIR, `${name}.png`) });
  const results = await page.evaluate(auditContrast, MIN_CONTRAST);
  const failed = results.filter((result) => !result.passes);
  failures += failed.length;
  const lowest = results.reduce(
    (low, result) => (result.ratio < low ? result.ratio : low),
    Infinity,
  );
  console.log(
    `${name}: ${results.length} texts, lowest ${lowest}:1, ${failed.length} below ${MIN_CONTRAST}:1`,
  );
  for (const result of failed)
    console.log(`  ${result.ratio}:1  "${result.text}"  ${result.element}`);
}
await browser.close();
console.log(`Screenshots in ${OUT_DIR}`);
process.exit(failures ? 1 : 0);
