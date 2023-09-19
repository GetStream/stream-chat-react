import type { FileLike } from './types';
import { ChangeEvent, useCallback } from 'react';

export const useHandleFileChangeWrapper = (
  resetOnChange = false,
  handler?: (files: Array<File>) => void,
) =>
  useCallback(
    ({ currentTarget }: ChangeEvent<HTMLInputElement>) => {
      const { files } = currentTarget;

      if (!files) return;

      try {
        handler?.(Array.from(files));
      } catch (error) {
        console.error(error);
      }

      if (resetOnChange) currentTarget.value = '';
    },
    [handler, resetOnChange],
  );

export function dataTransferItemsHaveFiles(items?: DataTransferItem[]): boolean {
  if (!items || !items.length) {
    return false;
  }
  for (const item of items) {
    if (item.kind === 'file' || item.type === 'text/html') {
      return true;
    }
  }
  return false;
}

export async function dataTransferItemsToFiles(items?: DataTransferItem[]): Promise<FileLike[]> {
  if (!items || !items.length) {
    return [];
  }

  // If there are files inside the DataTransferItem prefer those
  const fileLikes = getFileLikes(items);
  if (fileLikes.length) {
    return fileLikes;
  }

  // Otherwise extract images from html
  const blobPromises = [];
  for (const item of items) {
    if (item.type === 'text/html') {
      blobPromises.push(
        new Promise<void>((accept) => {
          item.getAsString(async (s) => {
            const imagePromises = extractImageSources(s).map((src) =>
              getImageSource(fileLikes, src),
            );

            await Promise.all(imagePromises);
            accept();
          });
        }),
      );
    }
  }
  await Promise.all(blobPromises);
  return fileLikes;
}

function getFileLikes(items: DataTransferItem[]) {
  const fileLikes = [];
  for (const item of items) {
    if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file) {
        fileLikes.push(file);
      }
    }
  }
  return fileLikes;
}

async function getImageSource(fileLikes: FileLike[], src: string) {
  let res;
  try {
    res = await fetch(src);
  } catch (e) {
    return;
  }
  const contentType = res.headers.get('Content-type') || 'application/octet-stream';
  const buf = await res.arrayBuffer();
  const blob = new Blob([buf], { type: contentType });
  fileLikes.push(blob);
}

const extractImageSources = (s: string) => {
  const imageTags = new DOMParser().parseFromString(s, 'text/html').getElementsByTagName('img');
  return Array.from(imageTags, (tag) => tag.src).filter((tag) => tag);
};
