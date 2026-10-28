import { useEffect } from 'react';
import { useChatContext } from 'stream-chat-react';

/**
 * For the screenshots only, not part of the recipe. Puts the channel list into one of its states by
 * changing the client's channel queries, never the demo app's data:
 *
 * - `?simulate=channel-list-loading`: the query never settles, so the first page stays loading;
 * - `?simulate=channel-list-empty`: the query asks for a channel id no channel has, so the server
 *   returns an empty first page;
 * - `?simulate=channel-list-error`: every query fails with a server error while the client stays
 *   connected, so the first page fails once the paginator's retries are used up, and so does Retry.
 *
 * Runs before the base app adds its paginator, so the first query already goes through it.
 */
export const SimulateChannelListState = () => {
  const { client } = useChatContext();

  useEffect(() => {
    const state = new URLSearchParams(window.location.search).get('simulate');
    const queryChannels = client.queryChannels.bind(client);

    if (state === 'channel-list-loading') {
      client.queryChannels = () => new Promise(() => undefined);
    } else if (state === 'channel-list-empty') {
      client.queryChannels = (request, requestOptions) =>
        queryChannels(
          {
            ...request,
            filter_conditions: {
              $and: [
                request?.filter_conditions ?? {},
                { id: { $in: ['docs-v15-cb-no-such-channel'] } },
              ],
            },
          },
          requestOptions,
        );
    } else if (state === 'channel-list-error') {
      client.queryChannels = () =>
        Promise.reject(new Error('Request failed with status code 500'));
    } else {
      return;
    }

    return () => {
      client.queryChannels = queryChannels;
    };
  }, [client]);

  return null;
};
