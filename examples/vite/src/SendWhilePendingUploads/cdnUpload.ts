import type {
  FileLike,
  FileReference,
  MinimumUploadRequestResult,
  UploadRequestOptions,
} from 'stream-chat';

/** Where uploads go: Stream's own storage, the dev server's mock CDN, or a CDN at a given URL. */
export type UploadDestination = 'stream' | 'mock-cdn' | 'custom-url';

/** The upload endpoint `mockCdnPlugin.ts` serves on the dev server. */
export const MOCK_CDN_UPLOAD_URL = `${window.location.origin}/mock-cdn/upload`;

const abortError = () => new DOMException('Upload aborted', 'AbortError');

/**
 * Uploads a file to a CDN that accepts `multipart/form-data` with the file in the `file` field and
 * answers with JSON `{ file: <public URL>, thumb_url?: <URL> }` — what `doUploadRequest` resolves
 * with. Reports progress through `options.onProgress` and stops on `options.abortSignal`.
 */
export const uploadToCdn = (
  url: string,
  fileLike: FileReference | FileLike,
  options?: UploadRequestOptions,
) =>
  new Promise<MinimumUploadRequestResult>((resolve, reject) => {
    if (!url) {
      reject(new Error('No CDN URL set: enter one in Settings → Composer.'));
      return;
    }
    if (!(fileLike instanceof Blob)) {
      reject(new Error('Only browser files can be uploaded to the CDN.'));
      return;
    }
    const signal = options?.abortSignal;
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.responseType = 'json';
    xhr.upload.onprogress = (event) => {
      options?.onProgress?.(
        event.lengthComputable
          ? Math.round((event.loaded / event.total) * 100)
          : undefined,
      );
    };
    xhr.onload = () => {
      const response = xhr.response as Partial<MinimumUploadRequestResult> | null;
      if (xhr.status >= 200 && xhr.status < 300 && typeof response?.file === 'string') {
        resolve(response as MinimumUploadRequestResult);
      } else {
        reject(new Error(`CDN upload failed with status ${xhr.status}.`));
      }
    };
    xhr.onerror = () => reject(new Error('CDN upload failed: network error.'));
    xhr.onabort = () => reject(abortError());
    signal?.addEventListener('abort', () => xhr.abort(), { once: true });

    const body = new FormData();
    body.append('file', fileLike, 'name' in fileLike ? fileLike.name : 'file');
    xhr.send(body);
  });
