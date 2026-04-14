import { watch } from 'node:fs';
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { compileAsync } from 'sass';

const SRC_DIR = path.resolve('src');
const STYLE_ENTRYPOINTS = [
  {
    entryFile: path.join(SRC_DIR, 'styling/index.scss'),
    outputFile: path.resolve('dist/css/index.css'),
  },
  {
    entryFile: path.join(SRC_DIR, 'styling/_emoji-replacement.scss'),
    outputFile: path.resolve('dist/css/emoji-replacement.css'),
  },
  {
    entryFile: path.join(SRC_DIR, 'plugins/Emojis/styling/index.scss'),
    outputFile: path.resolve('dist/css/emoji-picker.css'),
  },
];
const SCSS_EXTENSION = '.scss';
const BUILD_DELAY_MS = 150;
const SCAN_INTERVAL_MS = 500;

let activeBuild = false;
let buildQueued = false;
let buildQueuedTrigger = 'queued changes';
let buildTimer;
let lastTrigger = 'initial startup';
let knownScssState = new Map();
let pollingFallbackActive = false;
let scanInProgress = false;
let stopWatching = () => undefined;

const log = (message) => {
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  console.log(`[watch-styling ${time}] ${message}`);
};

const isScssFile = (filename) => filename.endsWith(SCSS_EXTENSION);

const toOutputRelativePath = (source, outputFile) =>
  path
    .relative(path.dirname(outputFile), fileURLToPath(source))
    .split(path.sep)
    .join('/');

const collectScssState = async () => {
  const scssState = new Map();
  const entries = await readdir(SRC_DIR, { recursive: true, withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !isScssFile(entry.name)) continue;

    const filePath = path.resolve(
      path.join(entry.parentPath ?? entry.path ?? SRC_DIR, entry.name),
    );

    try {
      const { mtimeMs } = await stat(filePath);
      scssState.set(filePath, mtimeMs);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }

  return scssState;
};

const findChangedFile = (previousState, nextState) => {
  for (const [filePath, mtimeMs] of nextState) {
    if (!previousState.has(filePath)) {
      return `added ${path.relative(process.cwd(), filePath)}`;
    }

    if (previousState.get(filePath) !== mtimeMs) {
      return `changed ${path.relative(process.cwd(), filePath)}`;
    }
  }

  for (const filePath of previousState.keys()) {
    if (!nextState.has(filePath)) {
      return `removed ${path.relative(process.cwd(), filePath)}`;
    }
  }

  return null;
};

const flushQueuedBuild = () => {
  if (!buildQueued) return;

  const trigger = buildQueuedTrigger;
  buildQueued = false;
  buildQueuedTrigger = 'queued changes';
  void runBuild(trigger);
};

const buildStyleEntry = async ({ entryFile, outputFile }) => {
  const { css, sourceMap } = await compileAsync(entryFile, {
    sourceMap: true,
    style: 'expanded',
  });
  const sourceMapFile = `${path.basename(outputFile)}.map`;
  const normalizedSourceMap = {
    ...sourceMap,
    file: path.basename(outputFile),
    sources: sourceMap.sources.map((source) =>
      source.startsWith('file://') ? toOutputRelativePath(source, outputFile) : source,
    ),
  };

  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, `${css}\n\n/*# sourceMappingURL=${sourceMapFile} */\n`);
  await writeFile(`${outputFile}.map`, JSON.stringify(normalizedSourceMap));
};

const buildStyling = async () => {
  for (const entry of STYLE_ENTRYPOINTS) {
    await buildStyleEntry(entry);
  }
};

const runBuild = async (trigger) => {
  if (activeBuild) {
    buildQueued = true;
    buildQueuedTrigger = trigger;
    return;
  }

  activeBuild = true;
  log(`running build-styling (${trigger})`);

  try {
    await buildStyling();
    log('build-styling completed');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(`build-styling failed: ${message}`);
  } finally {
    activeBuild = false;
    flushQueuedBuild();
  }
};

const scheduleBuild = (trigger) => {
  lastTrigger = trigger;
  clearTimeout(buildTimer);
  buildTimer = setTimeout(() => {
    void runBuild(lastTrigger);
  }, BUILD_DELAY_MS);
};

const formatNativeWatchTrigger = (filename) => {
  if (!filename) return 'filesystem event';

  const normalizedFilename = String(filename);
  if (!isScssFile(normalizedFilename)) return null;

  return `changed ${path.join(path.relative(process.cwd(), SRC_DIR), normalizedFilename)}`;
};

const scanForChanges = async () => {
  if (scanInProgress) return;
  scanInProgress = true;

  try {
    const nextState = await collectScssState();
    const trigger = findChangedFile(knownScssState, nextState);
    knownScssState = nextState;

    if (trigger) {
      scheduleBuild(trigger);
    }
  } finally {
    scanInProgress = false;
  }
};

const startPollingWatcher = async () => {
  if (pollingFallbackActive) return;

  pollingFallbackActive = true;
  stopWatching();
  knownScssState = await collectScssState();

  const scanInterval = setInterval(() => {
    void scanForChanges();
  }, SCAN_INTERVAL_MS);

  stopWatching = () => clearInterval(scanInterval);
  log(
    `watching ${path.relative(process.cwd(), SRC_DIR)}/**/*.scss for changes (polling fallback)`,
  );
};

const startNativeWatcher = () => {
  try {
    const watcher = watch(SRC_DIR, { recursive: true }, (_eventType, filename) => {
      const trigger = formatNativeWatchTrigger(filename);
      if (!trigger) return;

      scheduleBuild(trigger);
    });

    watcher.on('error', (error) => {
      if (pollingFallbackActive) return;

      log(`native watcher failed (${error.message}), falling back to polling`);
      watcher.close();
      void startPollingWatcher();
    });

    stopWatching = () => watcher.close();
    log(
      `watching ${path.relative(process.cwd(), SRC_DIR)}/**/*.scss for changes (native recursive watch)`,
    );
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(`native recursive watch unavailable (${message}), falling back to polling`);
    return false;
  }
};

const shutdown = () => {
  clearTimeout(buildTimer);
  stopWatching();
};

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});

await runBuild('initial startup');

if (!startNativeWatcher()) {
  await startPollingWatcher();
}
