import type { StreamChat } from 'stream-chat';

import type { MockedApiResponse } from './utils';

type AxiosRequest = (config: unknown) => Promise<unknown>;

/** Per-client mocked responses, keyed by HTTP verb. */
const mockedResponses = new WeakMap<
  StreamChat,
  Map<string, MockedApiResponse['response']>
>();
/** The pristine `axiosInstance.request`, captured before any spy was installed. */
const originalRequests = new WeakMap<StreamChat, AxiosRequest>();
const axiosErrorPrototypes = new WeakMap<StreamChat, object>();

/**
 * Resolves the `AxiosError.prototype` belonging to the axios module instance that
 * `stream-chat`'s `ApiClient` uses.
 *
 * We cannot `import { AxiosError } from 'axios'` here: vitest resolves axios through a
 * different export condition for inlined test code than for `stream-chat`'s bundled dist,
 * so the two are distinct classes. `ApiClient._doRequest` only converts a failure into a
 * `StreamAPIError` when `error instanceof AxiosError` (its own copy), so an error built from
 * our copy would escape unwrapped and lose `code`/`status`.
 *
 * An already-aborted signal makes axios reject synchronously (no network) with a
 * `CanceledError`, which extends `AxiosError` — so its grandparent prototype is the one we need.
 */
const resolveAxiosErrorPrototype = async (request: AxiosRequest, client: StreamChat) => {
  const cached = axiosErrorPrototypes.get(client);
  if (cached) return cached;

  const controller = new AbortController();
  controller.abort();
  try {
    await request({ signal: controller.signal, url: 'http://localhost/__mocked__' });
  } catch (error) {
    const prototype = Object.getPrototypeOf(Object.getPrototypeOf(error as object));
    axiosErrorPrototypes.set(client, prototype);
    return prototype;
  }
  throw new Error('Could not resolve the AxiosError prototype');
};

/**
 * Hook to mock the calls made through axios module.
 * You should provide the responses of Apis in order that they will be called.
 * You should use api functions from current directory to build these responses.
 * e.g., queryChannelsApi, sendMessageApi
 */
export const useMockedApis = (client: StreamChat, apiResponses: MockedApiResponse[]) => {
  // stream-chat v10 routes EVERY request through `axiosInstance.request(config)`; the per-verb
  // `axiosInstance.get/post/put/delete` helpers are never called, so spying on them intercepts
  // nothing and requests escape to the network. Keep the per-verb keying by dispatching on
  // `config.method`, and accumulate across calls so successive `useMockedApis` calls compose.
  let store = mockedResponses.get(client);
  if (!store) {
    store = new Map();
    mockedResponses.set(client, store);
  }
  apiResponses.forEach(({ response, type }) => store?.set(type, response));

  // Capture the pristine `request` BEFORE installing a spy — it is needed to harvest the
  // AxiosError prototype above (callers such as `initClientWithChannels` already spy).
  if (!originalRequests.has(client)) {
    const { request } = client.axiosInstance as unknown as { request: AxiosRequest };
    originalRequests.set(client, request.bind(client.axiosInstance) as AxiosRequest);
  }
  const originalRequest = originalRequests.get(client) as AxiosRequest;

  const spy = vi.spyOn(client.axiosInstance as any, 'request') as any;
  spy.mockImplementation(async (config: any) => {
    const method = String(config?.method ?? 'get').toLowerCase();
    const mocked = store?.get(method);
    if (!mocked) {
      throw new Error(
        `No mocked API response for ${method.toUpperCase()} ${config?.url}`,
      );
    }

    const response = {
      config,
      data: mocked.data,
      headers: {},
      request: {},
      status: mocked.status,
      statusText: '',
    };

    if (mocked.status >= 400) {
      // Real axios rejects on non-2xx; `erroredGetApi`/`erroredPostApi` (see ./error) rely on
      // it, and `ApiClient._doRequest` only maps a rejection to `StreamAPIError`.
      const prototype = await resolveAxiosErrorPrototype(originalRequest, client);
      const error = new Error(`Request failed with status code ${mocked.status}`);
      Object.setPrototypeOf(error, prototype);
      Object.assign(error, {
        code: 'ERR_BAD_RESPONSE',
        config,
        isAxiosError: true,
        response,
        status: mocked.status,
      });
      throw error;
    }

    return response;
  });
};

export * from './queryChannels';
export * from './queryMembers';
export * from './queryUsers';
export * from './getOrCreateChannel';
export * from './markRead';
export * from './threadReplies';
export * from './sendMessage';
export * from './error';
