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
 * Resolves the `AxiosError.prototype` of the axios copy that `stream-chat`'s `ApiClient` uses.
 *
 * Importing `AxiosError` from 'axios' yields a different class: vitest resolves axios through
 * another export condition for inlined test code than for `stream-chat`'s dist, and
 * `ApiClient._doRequest` only wraps errors that are `instanceof` its own copy. An already-aborted
 * signal makes axios reject without network with a `CanceledError`, which extends `AxiosError`, so
 * two prototype hops from it reach the prototype needed.
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
 * Mocks the client's HTTP requests with responses built by the API helpers of this directory (e.g.
 * `queryChannelsApi`, `sendMessageApi`). Responses are keyed by HTTP method, so a later response
 * for a method replaces the earlier one, and they accumulate across calls.
 *
 * @param client - Client whose `axiosInstance.request` is mocked.
 * @param apiResponses - Responses to serve.
 */
export const useMockedApis = (client: StreamChat, apiResponses: MockedApiResponse[]) => {
  // Every request goes through `axiosInstance.request(config)`, not the per-verb helpers, so
  // responses are dispatched on `config.method`.
  let store = mockedResponses.get(client);
  if (!store) {
    store = new Map();
    mockedResponses.set(client, store);
  }
  apiResponses.forEach(({ response, type }) => store?.set(type, response));

  // Captured before the spy is installed: the AxiosError prototype lookup above needs the real
  // `request`.
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
      // Real axios rejects on non-2xx and `ApiClient._doRequest` only maps a rejection to
      // `StreamAPIError`; the errored helpers in ./error rely on both.
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
