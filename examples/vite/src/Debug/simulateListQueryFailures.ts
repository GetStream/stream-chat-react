import type { StreamChat } from 'stream-chat';

/**
 * Makes the channel or thread list queries fail, to see the lists' load-error state without
 * console boilerplate.
 *
 *   ?simulate=channel-list-error                              every channel list query fails
 *   ?simulate=thread-list-error                               every thread list query fails
 *   ?simulate=channel-list-error&simulate=thread-list-error   both
 *
 * The failures last until turned off from the console, so a Try again fails too, until then:
 *
 *   streamSimulatedFailures.channelList = false; // the next channel list query goes through
 *   streamSimulatedFailures.threadList = false; // the next thread list query goes through
 *
 * The client stays connected; only `queryChannelsAndHydrate` and `queryThreadsAndHydrate` reject.
 * Channel and message search query through `queryChannelsAndHydrate` too, so
 * `channel-list-error` makes them fail as well. A channel list fails after its paginator's retries
 * (about three seconds), a thread list at once. A new client (another user) starts again from the
 * URL's failures.
 */

const SIMULATE_PARAM = 'simulate';

type SimulatedFailures = { channelList: boolean; threadList: boolean };

type AnyQuery = (...args: unknown[]) => Promise<unknown>;

const patchedClients = new WeakSet<StreamChat>();

const simulatedFailure = () =>
  Promise.reject(new Error('Simulated query failure (?simulate= URL param)'));

/**
 * Applies the failures the URL asks for to `client`, once per client. Call it before the lists
 * mount, so their first queries already fail.
 */
export const applySimulatedListQueryFailures = (client: StreamChat) => {
  if (patchedClients.has(client)) return;
  patchedClients.add(client);

  const requested = new URLSearchParams(window.location.search).getAll(SIMULATE_PARAM);
  const failures: SimulatedFailures = {
    channelList: requested.includes('channel-list-error'),
    threadList: requested.includes('thread-list-error'),
  };
  if (!failures.channelList && !failures.threadList) return;

  // The casts keep the methods' overloads, which a plain arrow function cannot implement.
  const queryChannels = client.queryChannelsAndHydrate.bind(client) as AnyQuery;
  const queryThreads = client.queryThreadsAndHydrate.bind(client) as AnyQuery;
  client.queryChannelsAndHydrate = ((...args) =>
    failures.channelList
      ? simulatedFailure()
      : queryChannels(...args)) as AnyQuery as StreamChat['queryChannelsAndHydrate'];
  client.queryThreadsAndHydrate = ((...args) =>
    failures.threadList
      ? simulatedFailure()
      : queryThreads(...args)) as AnyQuery as StreamChat['queryThreadsAndHydrate'];

  (
    window as unknown as { streamSimulatedFailures: SimulatedFailures }
  ).streamSimulatedFailures = failures;
  console.info(
    '[simulate] list queries fail:',
    failures,
    '— set streamSimulatedFailures.channelList / .threadList to false to let them through.',
  );
};
