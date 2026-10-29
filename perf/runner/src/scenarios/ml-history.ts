import type { Page } from 'playwright';

import type { ChannelType } from '../config.ts';
import { historyScroll } from '../history.ts';
import { gesture, REST_MS, scrollEdge } from '../input.ts';
import { readManifest } from '../manifest.ts';
import type { RunScenario } from './run.ts';

// Message-list variants on ML-01's history-scroll window (history.ts), each on its own dataset
// (WEB-PLAN.md ML-02 … ML-07), plus ML-16 (ML-15's open on ML-04's data).
//
//   ML-02  800 messages, text-layout variety (long, markdown, emoji, RTL, CJK)
//   ML-03  600 messages, 40 % images, cold image cache (a fresh context per iteration, the default)
//   ML-04  400 messages, 5 reactions each
//   ML-05  400 messages, 30 % with thread replies
//   ML-06  300 messages in a quoted-reply chain (Stream may drop up to 5 % of quotes; verify warns)
//   ML-07  every message kind interleaved (kitchen sink), + the kinds-rendered gate

const cidOf = (type: ChannelType, id: string) => `${type}:perf-${id}`;
const marker = (n: number) => `[${String(n).padStart(4, '0')}]`;

const variant = (
  id: string,
  seeded: number,
  seed: string[] = ['seed', id, '--yes'],
): RunScenario => ({
  context: 'fresh',
  dataset: { seed, verify: id },
  id,
  lists: true,
  measure: async (ctx) => {
    const { rect: _rect, ...measurement } = await historyScroll(ctx, {
      cid: cidOf(ctx.type, id),
      expected: seeded,
      markers: 'contiguous',
      newest: marker(seeded),
    });
    return measurement;
  },
  metric: 'M-FRAMES',
  types: ['messaging', 'livestream'],
  unit: '%',
});

export const ml02 = variant('ml-02', 800);
export const ml03 = variant('ml-03', 600);
export const ml04 = variant('ml-04', 400, [
  'seed',
  'ml-04',
  '--concurrency',
  '4',
  '--yes',
]);
export const ml05 = variant('ml-05', 400, [
  'seed',
  'ml-05',
  '--concurrency',
  '4',
  '--yes',
]);
export const ml06 = variant('ml-06', 300);

// --- ML-07 ------------------------------------------------------------------------------------

/** chatperf's kitchen-sink order (seeders/kitchen_sink.rb SPECIALS): positions derive from it. */
const SPECIALS = [
  'long',
  'emoji',
  'markdown',
  'rtl',
  'cjk',
  'image',
  'gallery',
  'file',
  'giphy',
  'link',
  'mention',
  'quoted',
  'thread',
  'pinned',
  'edited',
  'deleted',
  'system',
  'reactions',
  'poll',
  'reminder',
] as const;

/** The marker index of every special kind, exactly as chatperf's build_plan lays them out. */
export const kindMarkers = (total: number) => {
  const specials = [...SPECIALS];
  const step = Math.max(Math.floor(total / (specials.length + 1)), 1);
  const plan: string[] = [];
  for (let i = 1; i <= total; i++) {
    plan.push('base');
    if (i % step === 0 && specials.length) plan.push(specials.shift()!);
  }
  plan.push(...specials);
  const at: Record<string, number> = {};
  plan.forEach((kind, position) => {
    if (kind !== 'base') at[kind] = position + 1;
  });
  return at;
};

/**
 * What proves each kind rendered, inside its own row. Text-only kinds (long, emoji, rtl, cjk) only
 * need their row. A deleted message keeps no text, so it's found as the row after its predecessor.
 */
const KIND_SELECTOR: Record<string, string> = {
  cjk: '.str-chat__message-text',
  deleted: '.str-chat__message--deleted',
  edited: '.str-chat__message-edited-indicator',
  emoji: '.str-chat__message-text',
  file: '.str-chat__message-attachment--file, .str-chat__file-attachment',
  gallery: '.str-chat__gallery, .str-chat__message-attachment--gallery',
  giphy: '.str-chat__message-attachment--giphy, .str-chat__giphy-attachment',
  image: '.str-chat__message-attachment--image img, .str-chat__attachment-media img',
  link: '.str-chat__message-attachment-card, .str-chat__message-attachment--card',
  long: '.str-chat__message-text',
  markdown:
    '.str-chat__message-text strong, .str-chat__message-text em, .str-chat__message-text code',
  mention: '.str-chat__message-mention',
  pinned: '.str-chat__message--pinned',
  poll: '.str-chat__poll',
  quoted: '.str-chat__quoted-message-preview',
  reactions: '.str-chat__message-reactions',
  reminder: '.str-chat__message-reminder',
  rtl: '.str-chat__message-text',
  system: '.str-chat__message--system',
  thread: '.str-chat__message-replies-count-button',
};

/**
 * After the window: which seeded kinds rendered. The standard list keeps every loaded row in the DOM,
 * so one look covers it; the virtualized list renders only what's near the viewport, so it is walked
 * down from the top with slow gestures, collecting what each rest shows.
 */
const kindsRendered = async (
  page: Page,
  ctx: Parameters<RunScenario['measure']>[0],
  rect: { x: number; y: number; width: number; height: number },
  kinds: string[],
  total: number,
) => {
  const at = kindMarkers(total);
  const checks = kinds
    .filter((kind) => KIND_SELECTOR[kind])
    .map((kind) =>
      kind === 'deleted'
        ? { afterMarker: true, kind, marker: at[kind] - 1, selector: KIND_SELECTOR[kind] }
        : { kind, marker: at[kind], selector: KIND_SELECTOR[kind] },
    );
  const seen = new Set<string>();
  const look = async () => {
    for (const kind of await page.evaluate(
      (c) => window.__perf!.messages.kindsInDom(c),
      checks,
    )) {
      seen.add(kind);
    }
  };
  await look();
  for (let g = 0; g < 200 && seen.size < checks.length; g++) {
    if ((await scrollEdge(page)).atBottom) break;
    await gesture(ctx.cdp, rect, 'G-SLOW', 'down');
    await page.waitForTimeout(REST_MS / 2);
    await look();
  }
  return {
    checked: checks.map((c) => c.kind),
    missing: checks.map((c) => c.kind).filter((k) => !seen.has(k)),
  };
};

export const ml07: RunScenario = {
  context: 'fresh',
  dataset: { seed: ['seed', 'ml-07', '--yes'], verify: 'ml-07' },
  id: 'ml-07',
  lists: true,
  measure: async (ctx) => {
    const manifest = readManifest('ml-07');
    const total = Number(manifest.params.messages);
    const rows = Number(manifest.extras.top_level_messages);
    const kinds = (manifest.extras.kinds as string[]) ?? [];
    // A skipped kind (polls are off on livestream) can cost its row, so the newest marker is read
    // from SDK state rather than computed.
    const { rect, ...measurement } = await historyScroll(ctx, {
      cid: cidOf(ctx.type, 'ml-07'),
      expected: rows,
      markers: 'ascending',
    });
    // Validation only (PERF_GATE_CHECK_KIND=<kind>): pretend that kind was seeded but look for a
    // selector that can't match, so the gate must fail and name it.
    const broken = process.env.PERF_GATE_CHECK_KIND;
    if (broken) KIND_SELECTOR[broken] = '.perf-gate-check-never-matches';
    const result = await kindsRendered(ctx.page, ctx, rect, kinds, total);
    if (result.missing.length) {
      measurement.gates = [
        ...(measurement.gates ?? []),
        `kinds-rendered: ${result.missing.join(', ')} did not render`,
      ];
    }
    return {
      ...measurement,
      extra: {
        ...measurement.extra,
        kindsChecked: result.checked,
        kindsMissing: result.missing,
      },
    };
  },
  metric: 'M-FRAMES',
  types: ['messaging', 'livestream'],
  unit: '%',
};

// --- ML-16 ------------------------------------------------------------------------------------

/** ML-16: ML-15's open on ML-04's reaction-heavy data → M-SETTLE. Compare with ML-15. */
export const ml16: RunScenario = {
  context: 'fresh',
  dataset: { seed: ['seed', 'ml-04', '--concurrency', '4', '--yes'], verify: 'ml-04' },
  id: 'ml-16',
  lists: true,
  measure: async ({ page, type }) => {
    await page.evaluate(() => window.__perf!.ready());
    const result = await page.evaluate(
      (cid) => window.__perf!.openChannel(cid, '[0400]'),
      cidOf(type, 'ml-04'),
    );
    return { value: result.durationMs };
  },
  metric: 'M-SETTLE',
  types: ['messaging', 'livestream'],
  unit: 'ms',
};
