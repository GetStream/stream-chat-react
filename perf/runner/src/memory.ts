import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { CDPSession } from 'playwright';

import { metrics } from './collect.ts';
import { resultsDir } from './results.ts';

// M-MEM (WEB-SCENARIOS.md §1.5): JS heap, DOM nodes and event listeners from
// Performance.getMetrics, sampled at 1 Hz over CDP (no page JavaScript), with forced GC before the
// readings that count, and a count of detached DOM nodes (held by JS after leaving the document:
// the usual shape of a web leak).

export type MemorySample = {
  t: number;
  heapMB: number;
  nodes: number;
  listeners: number;
  /** Cumulative main-thread task time (TaskDuration), seconds: per-minute CPU comes from its deltas. */
  taskS: number;
};

const sample = async (cdp: CDPSession, t0: number): Promise<MemorySample> => {
  const m = await metrics(cdp);
  return {
    heapMB: Math.round(m.JSHeapUsedSize / 1e5) / 10,
    listeners: m.JSEventListeners,
    nodes: m.Nodes,
    taskS: m.TaskDuration,
    t: Math.round((Date.now() - t0) / 100) / 10,
  };
};

/** Collect garbage (twice: the first pass can leave finalizer-held objects) and read. */
export const afterGc = async (cdp: CDPSession) => {
  await cdp.send('HeapProfiler.collectGarbage');
  await cdp.send('HeapProfiler.collectGarbage');
  return sample(cdp, Date.now());
};

/** Starts 1 Hz sampling; `stop()` returns the samples and any labelled moments. */
export const sampleMemory = (cdp: CDPSession, intervalMs = 1000) => {
  const t0 = Date.now();
  const samples: MemorySample[] = [];
  const labels: Array<{ t: number; label: string }> = [];
  let running = true;
  const loop = (async () => {
    while (running) {
      samples.push(await sample(cdp, t0).catch(() => samples.at(-1)!));
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  })();
  return {
    label: (label: string) =>
      labels.push({ label, t: Math.round((Date.now() - t0) / 100) / 10 }),
    stop: async () => {
      running = false;
      await loop;
      return { labels, samples: samples.filter(Boolean) };
    },
  };
};

/**
 * Detached DOM nodes still reachable from JS, after GC. Chromium's DOM.getDetachedDomNodes
 * (experimental) lists them directly; null if the method isn't available.
 */
export const detachedNodes = async (cdp: CDPSession) => {
  try {
    await cdp.send('DOM.enable');
    const { detachedNodes: list } = (await cdp.send(
      'DOM.getDetachedDomNodes' as never,
    )) as unknown as {
      detachedNodes: Array<{ treeNode: { nodeName: string }; retainedNodeIds: number[] }>;
    };
    const byTag: Record<string, number> = {};
    for (const n of list)
      byTag[n.treeNode.nodeName] = (byTag[n.treeNode.nodeName] ?? 0) + 1;
    return {
      byTag,
      retained: list.reduce((sum, n) => sum + n.retainedNodeIds.length, 0),
      roots: list.length,
    };
  } catch {
    return null;
  }
};

export const peak = (samples: MemorySample[]) => ({
  heapMB: Math.max(...samples.map((s) => s.heapMB)),
  listeners: Math.max(...samples.map((s) => s.listeners)),
  nodes: Math.max(...samples.map((s) => s.nodes)),
});

/** A self-contained HTML chart (inline SVG) of a run's samples, saved beside its results. */
export const writeChart = (
  name: string,
  samples: MemorySample[],
  labels: Array<{ t: number; label: string }>,
) => {
  const W = 900;
  const H = 220;
  const tMax = Math.max(1, ...samples.map((s) => s.t));
  const line = (key: 'heapMB' | 'nodes' | 'listeners', color: string) => {
    const max = Math.max(1, ...samples.map((s) => s[key]));
    const pts = samples
      .map(
        (s) => `${((s.t / tMax) * W).toFixed(1)},${(H - (s[key] / max) * H).toFixed(1)}`,
      )
      .join(' ');
    return `<polyline fill="none" stroke="${color}" stroke-width="2" points="${pts}"/><text x="4" y="${
      { heapMB: 14, listeners: 42, nodes: 28 }[key]
    }" fill="${color}" font-size="12">${key} (max ${max})</text>`;
  };
  const marks = labels
    .map(
      (l) =>
        `<line x1="${(l.t / tMax) * W}" x2="${(l.t / tMax) * W}" y1="0" y2="${H}" stroke="#999" stroke-dasharray="4"/>` +
        `<text x="${(l.t / tMax) * W + 3}" y="${H - 4}" font-size="11" fill="#666">${l.label}</text>`,
    )
    .join('');
  const html =
    `<!doctype html><meta charset="utf-8"><title>${name}</title>` +
    `<body style="font-family:system-ui;margin:16px"><h3>${name}</h3>` +
    `<svg width="${W}" height="${H}" style="border:1px solid #ddd">${line('heapMB', '#c0392b')}` +
    `${line('nodes', '#2980b9')}${line('listeners', '#27ae60')}${marks}</svg>` +
    `<p>${samples.length} samples over ${tMax} s, each line scaled to its own max.</p></body>`;
  mkdirSync(resultsDir, { recursive: true });
  const file = resolve(resultsDir, `${name}-chart.html`);
  writeFileSync(file, html);
  return file;
};
