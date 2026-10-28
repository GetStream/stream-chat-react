/**
 * Takes the screenshots every recipe's shots.json lists, from the running cookbook app, and writes
 * them where the docs read them.
 *
 *   yarn workspace @stream-io/stream-chat-react-cookbook dev        # in another terminal
 *   yarn workspace @stream-io/stream-chat-react-cookbook shots \
 *     --out /path/to/getstream.io/content/docs/chat-sdk/react/v15-rc/_assets [--only headers/channel-header]
 *
 * A relative --out is resolved from the repository root.
 *
 * A shot in shots.json:
 *   file      output file name (PNG)
 *   recipe    recipe id, or "base" for the base app alone; defaults to the folder's recipe
 *   variant   recipe variant (file name before .recipe.tsx); defaults to "default"
 *   query     extra URL parameters, e.g. { "channel": "...", "thread": "..." }
 *   viewport  { width, height }; defaults to the 1280×720 frame
 *   waitFor   selector that must be visible before the shot (default: the message list)
 *   hover     selector to hover first
 *   clip      selector of the element to capture; omit for the whole frame
 *   hasText   only the clip element containing this text
 *   padding   pixels around the clip element (default 8)
 *   settleMs  extra wait after everything is visible (default 800)
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const recipesDir = path.join(root, 'src/recipes');
const args = process.argv.slice(2);
// Accepts `--name value` and `--name=value`.
const argValue = (name) => {
  const inline = args.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};

// `yarn workspace … shots` runs in examples/cookbook, and Yarn reports no other starting folder,
// so a relative --out is resolved from the repository root (PROJECT_CWD) for a predictable result.
const outArg = argValue('--out');
const outDir = outArg && path.resolve(process.env.PROJECT_CWD ?? process.cwd(), outArg);
const only = argValue('--only');
const baseUrl = argValue('--url') ?? 'http://localhost:5176';
if (!outDir) {
  console.error('Pass --out <directory>, e.g. the docs v15-rc/_assets folder.');
  process.exit(1);
}

const findShotFiles = async () => {
  const files = [];
  for (const group of await readdir(recipesDir, { withFileTypes: true })) {
    if (!group.isDirectory()) continue;
    for (const recipe of await readdir(path.join(recipesDir, group.name), {
      withFileTypes: true,
    })) {
      if (!recipe.isDirectory()) continue;
      const id = `${group.name}/${recipe.name}`;
      if (only && id !== only) continue;
      const file = path.join(recipesDir, id, 'shots.json');
      try {
        files.push({ id, shots: JSON.parse(await readFile(file, 'utf8')) });
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  }
  return files;
};

const shotFiles = await findShotFiles();
if (!shotFiles.length) {
  console.error(only ? `No recipe ${only} with a shots.json.` : 'No shots.json found.');
  process.exit(1);
}
const seen = new Map();
for (const { id, shots } of shotFiles) {
  for (const { file } of shots) {
    if (seen.has(file)) {
      console.error(
        `${file} is listed by both ${seen.get(file)} and ${id}; names must be unique.`,
      );
      process.exit(1);
    }
    seen.set(file, id);
  }
}

const browser = await chromium.launch();
let failures = 0;

try {
  for (const { id, shots } of shotFiles) {
    for (const shot of shots) {
      const viewport = shot.viewport ?? { height: 720, width: 1280 };
      // A fixed locale and time zone, so dates in a shot don't depend on the machine taking it.
      const page = await browser.newPage({
        deviceScaleFactor: 1,
        locale: 'en-US',
        timezoneId: 'UTC',
        viewport,
      });
      try {
        const params = new URLSearchParams({
          recipe: shot.recipe ?? id,
          variant: shot.variant ?? 'default',
          ...shot.query,
        });
        await page.goto(`${baseUrl}/?${params}`);
        await page
          .locator(shot.waitFor ?? '.str-chat__message-list')
          .first()
          .waitFor();
        if (shot.hover) await page.locator(shot.hover).first().hover();
        await page.waitForTimeout(shot.settleMs ?? 800);

        const target = path.join(outDir, shot.file);
        if (shot.clip) {
          let locator = page.locator(shot.clip);
          if (shot.hasText) locator = locator.filter({ hasText: shot.hasText });
          const element = locator.first();
          if (!(await element.count())) throw new Error(`nothing matches ${shot.clip}`);
          await element.scrollIntoViewIfNeeded();
          const box = await element.boundingBox();
          if (!box || box.width <= 0 || box.height <= 0) {
            throw new Error(`${shot.clip} isn't visible`);
          }
          const padding = shot.padding ?? 8;
          const x = Math.max(0, box.x - padding);
          const y = Math.max(0, box.y - padding);
          await page.screenshot({
            clip: {
              height: Math.min(viewport.height, box.y + box.height + padding) - y,
              width: Math.min(viewport.width, box.x + box.width + padding) - x,
              x,
              y,
            },
            path: target,
          });
        } else {
          await page.screenshot({ path: target });
        }
        console.log(`✓ ${id}: ${shot.file}`);
      } catch (error) {
        failures++;
        console.error(`✗ ${id}: ${shot.file}: ${error.message}`);
      } finally {
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}

process.exit(failures ? 1 : 0);
