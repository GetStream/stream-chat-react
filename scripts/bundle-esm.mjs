#!/usr/bin/env node

import { exec } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import glob from 'glob';
import { promisify } from 'node:util';
import getPackageVersion from './get-package-version.mjs';

const execAsync = promisify(exec);

const version = getPackageVersion();

const bundleEsm = async () => {
  // Run TypeScript compiler
  console.log('Running TypeScript compiler...');
  await execAsync('tsc');

  // Replace version string in generated files
  console.log('Replacing version strings...');
  const files = glob.glob.sync('dist/**/*.js');
  await Promise.all(
    files.map(async (file) => {
      const content = await readFile(file, 'utf8');
      const newContent = content.replace(
        /process.env.STREAM_CHAT_REACT_VERSION/g,
        JSON.stringify(version),
      );
      await writeFile(file, newContent);
    }),
  );

  console.log('ESM build complete');
};

bundleEsm().catch(console.error);
