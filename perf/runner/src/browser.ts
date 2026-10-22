import {
  type Browser,
  type BrowserContext,
  type CDPSession,
  chromium,
  type Page,
} from 'playwright';

import { type Column, COLUMNS, DEVICE_SCALE_FACTOR, VIEWPORT } from './config.ts';

// Headed by default: a real window with a real compositor is what users scroll in. `--headless` is
// for quick checks only, and the result rows say which one ran.

export const launchBrowser = (headless: boolean) => chromium.launch({ headless });

export type Iteration = { context: BrowserContext; page: Page; cdp: CDPSession };

/**
 * A fresh browser context: no cache, no storage, no service worker — the web version of clearing the
 * app's data, at no cost (WEB-SCENARIOS.md §1.6). CPU throttling is applied per page for the column.
 */
export const newIteration = async (
  browser: Browser,
  column: Column,
): Promise<Iteration> => {
  const context = await browser.newContext({
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    viewport: VIEWPORT,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  const { cpuThrottle } = COLUMNS[column];
  if (cpuThrottle > 1)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuThrottle });
  return { cdp, context, page };
};

/** Reload in the same context (warm HTTP cache), keeping the column's CPU throttling. */
export const reloadIteration = async ({ page }: Iteration) => {
  await page.reload();
};
