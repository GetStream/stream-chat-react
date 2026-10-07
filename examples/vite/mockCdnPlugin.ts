import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, resolve } from 'node:path';
import { Readable } from 'node:stream';
import type { Connect, Plugin } from 'vite';

/** URL prefix the mock CDN is served under, on the dev (and preview) server's own origin. */
export const MOCK_CDN_PATH = '/mock-cdn';

/** Stored file names: a UUID plus the uploaded file's extension, nothing a path could escape with. */
const STORED_NAME = /^[0-9a-f-]{36}(\.[\w]{1,10})?$/i;

type StoredFileMeta = { name: string; type: string };

const sendJson = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const readFormData = (req: IncomingMessage) => {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(key, value);
    else if (Array.isArray(value)) value.forEach((item) => headers.append(key, item));
  }
  return new Request(`http://mock-cdn${req.url ?? ''}`, {
    body: Readable.toWeb(req) as ReadableStream,
    // required by Node for a streamed request body
    duplex: 'half',
    headers,
    method: 'POST',
  } as RequestInit).formData();
};

/**
 * A stand-in CDN for trying `doUploadRequest` against storage Stream does not host.
 *
 * - `POST /mock-cdn/upload` takes `multipart/form-data` with the file in the `file` field, stores it
 *   under `storageDir` and answers `{ file: <its URL> }` — the shape `doUploadRequest` resolves with.
 * - `GET /mock-cdn/files/<name>` serves a stored file back.
 *
 * Files live on disk, so they outlive a dev-server restart. The URLs point at this server, so only
 * browsers that can reach it can display them.
 */
export const mockCdnPlugin = ({ storageDir }: { storageDir: string }): Plugin => {
  const handle: Connect.NextHandleFunction = (req, res, next) => {
    const path = (req.url ?? '').split('?')[0];
    if (!path.startsWith(`${MOCK_CDN_PATH}/`)) return next();

    void (async () => {
      try {
        if (req.method === 'POST' && path === `${MOCK_CDN_PATH}/upload`) {
          const file = (await readFormData(req)).get('file');
          if (!(file instanceof Blob)) {
            return sendJson(res, 400, {
              message: 'Expected a file in the "file" field.',
            });
          }
          const name =
            'name' in file && typeof file.name === 'string' ? file.name : 'file';
          const storedName = `${randomUUID()}${extname(name).slice(0, 11)}`;
          await mkdir(storageDir, { recursive: true });
          await writeFile(
            resolve(storageDir, storedName),
            Buffer.from(await file.arrayBuffer()),
          );
          const meta: StoredFileMeta = {
            name,
            type: file.type || 'application/octet-stream',
          };
          await writeFile(
            resolve(storageDir, `${storedName}.json`),
            JSON.stringify(meta),
          );
          return sendJson(res, 201, {
            file: `http://${req.headers.host}${MOCK_CDN_PATH}/files/${storedName}`,
          });
        }

        const fileMatch = path.match(new RegExp(`^${MOCK_CDN_PATH}/files/([^/]+)$`));
        if (req.method === 'GET' && fileMatch && STORED_NAME.test(fileMatch[1])) {
          const storedName = fileMatch[1];
          const meta = JSON.parse(
            await readFile(resolve(storageDir, `${storedName}.json`), 'utf8'),
          ) as StoredFileMeta;
          res.statusCode = 200;
          res.setHeader('Content-Type', meta.type);
          res.setHeader(
            'Content-Disposition',
            `inline; filename="${encodeURIComponent(meta.name)}"`,
          );
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return res.end(await readFile(resolve(storageDir, storedName)));
        }

        sendJson(res, 404, { message: 'Not found.' });
      } catch (error) {
        const missing = (error as NodeJS.ErrnoException).code === 'ENOENT';
        sendJson(res, missing ? 404 : 500, {
          message: missing ? 'Not found.' : String(error),
        });
      }
    })();
  };

  return {
    configurePreviewServer: (server) => {
      server.middlewares.use(handle);
    },
    configureServer: (server) => {
      server.middlewares.use(handle);
    },
    name: 'mock-cdn',
  };
};
