#!/usr/bin/env node

import fsPromises from 'fs/promises';
import fs from 'fs';
import path, { resolve } from 'path';
import readline from 'readline';

const ACCEPTED_FILE_EXTENSIONS = ['md', 'mdx']; // TODO: maybe regex later

const walkJson = async (jsonPath) => {
  const json = await fsPromises.readFile(resolve(jsonPath));

  const docs = JSON.parse(json)['docs'];

  const paths = [];

  while (docs.length) {
    const stringOrObject = docs.pop();

    if (typeof stringOrObject === 'string') {
      paths.push(stringOrObject);
      continue;
    }

    // TODO: cover case of complex config objects (https://docusaurus.io/docs/next/sidebar/items#sidebar-item-category)
    if (Object.keys(stringOrObject).length > 1) continue;

    const [vals] = Object.values(stringOrObject);

    docs.push(...vals);
  }

  return paths;
};

const walkFiles = async (docsPath) => {
  const resolvedPath = resolve(docsPath);
  const files = await fsPromises.readdir(resolvedPath, { withFileTypes: true });

  const extractIdPromises = [];

  while (files.length) {
    const fileOrDirectory = files.pop();

    const completePath = resolve(fileOrDirectory.parentPath, fileOrDirectory.name);

    if (fileOrDirectory.isDirectory()) {
      const d = await fsPromises.readdir(completePath, { withFileTypes: true });
      files.push(...d);
      continue;
    }

    if (
      fileOrDirectory.isFile() &&
      ACCEPTED_FILE_EXTENSIONS.some((extension) =>
        fileOrDirectory.name.endsWith(extension),
      )
    ) {
      extractIdPromises.push(extractIdFromFile(completePath));
    }
  }

  const finalPaths = (await Promise.allSettled(extractIdPromises))
    .filter((v) => v.status === 'fulfilled')
    .map((v) => v.value.replace(resolvedPath + path.sep, ''));

  return finalPaths;
};

const extractIdFromFile = async (resolvedPath) => {
  const rs = fs.createReadStream(resolvedPath);
  const rli = readline.createInterface({ input: rs });

  let limit = 8;
  const id = await new Promise((resolve, reject) => {
    rli.on('line', (line) => {
      if (!limit) return rli.pause();

      if (!line.startsWith('id:')) return;

      const id = line.replace(/^(id:)\s*/, '').trim();

      resolve(id);
    });

    rli.on('pause', () => {
      // extractIdFromFile executed "sync" unless this is here
      setTimeout(() => {
        reject('EOF');
      }, 50);
    });
  });

  rli.close();
  rs.close();

  const d = resolvedPath.split(path.sep);
  d.pop();
  d.push(id);
  return d.join(path.sep);
};

(async () => {
  const args = process.argv;

  if (!args.includes('--folder-path')) throw new Error('Missing --folder-path');
  if (!args.includes('--json-path')) throw new Error('Missing --json-path');

  const folderPath = args.at(args.indexOf('--folder-path') + 1);
  const jsonPath = args.at(args.indexOf('--json-path') + 1);

  const [definedPaths, availablePaths] = await Promise.all([
    walkJson(jsonPath),
    walkFiles(folderPath),
  ]);

  const unusedPaths = availablePaths.filter((p) => !definedPaths.includes(p));
  const nonExistentPaths = definedPaths.filter((p) => !availablePaths.includes(p));

  console.log('Paths missing from sidebars_[platform].json:', unusedPaths);
  console.log(
    'Paths defined in sidebars_[platform].json but missing from docs:',
    nonExistentPaths,
  );
})();
