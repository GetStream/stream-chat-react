// Regenerates the vendored emoji dataset used by the built-in emoji picker and
// search index (src/plugins/Emojis/data/emoji-data.json).
//
// We vendor a snapshot of @emoji-mart/data's *native* set (no spritesheet) so the
// SDK ships its own emoji data and does not depend on the unmaintained emoji-mart
// packages at runtime. @emoji-mart/data stays a pinned devDependency used ONLY by
// this script.
//
// Usage: node scripts/vendor-emoji-data.mjs
//
// The dataset is MIT-licensed (Copyright (c) Missive); its license is copied
// verbatim to src/plugins/Emojis/data/LICENSE.

import { createRequire } from 'node:module';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

// @emoji-mart/data's "main" resolves to sets/15/native.json (its newest set), so
// pinning 15 matches a bare `import data from '@emoji-mart/data'`.
const SET = 15;

const require = createRequire(import.meta.url);

const sourcePath = require.resolve(`@emoji-mart/data/sets/${SET}/native.json`);
const pkgPath = require.resolve('@emoji-mart/data/package.json');
const pkg = require('@emoji-mart/data/package.json');
const licensePath = join(dirname(pkgPath), 'LICENSE');

const outDir = resolve(process.cwd(), 'src/plugins/Emojis/data');
const outDataPath = join(outDir, 'emoji-data.json');
const outLicensePath = join(outDir, 'LICENSE');

const data = JSON.parse(readFileSync(sourcePath, 'utf8'));

// `sheet` only describes spritesheet geometry (cols/rows); we render native unicode
// exclusively, so it is dead weight. Everything else (categories, emojis, aliases)
// is preserved verbatim so mapEmojiMartData and the search index keep working.
delete data.sheet;

mkdirSync(outDir, { recursive: true });
writeFileSync(outDataPath, JSON.stringify(data));
copyFileSync(licensePath, outLicensePath);

const emojiCount = Object.keys(data.emojis).length;
console.log(
  `Vendored @emoji-mart/data@${pkg.version} (set ${SET}, native): ` +
    `${emojiCount} emoji, ${data.categories.length} categories -> ${outDataPath}`,
);
console.log(`Copied upstream MIT LICENSE -> ${outLicensePath}`);
