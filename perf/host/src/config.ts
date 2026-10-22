// Everything the host needs comes from the URL, so no run needs a rebuild:
//
//   ?api_key=…&token=…&user_id=qatest1&list=virtualized&type=messaging
//
// Anything missing or unknown is an error shown on the page — never a silent default, because a
// typo that falls back to a default produces a wrong number that looks right.

export type ListImplementation = 'standard' | 'virtualized';
export type ChannelType = 'messaging' | 'livestream';

export type PerfHostConfig = {
  apiKey: string;
  token: string;
  userId: string;
  list: ListImplementation;
  type: ChannelType;
  /** `maxLoadedItems` on every message paginator, or 'none' for unbounded. */
  cap: number | 'none';
  /** True when `cap` is the protocol's value for `type`; false for an exploration override. */
  capIsCanonical: boolean;
  pageSize: number;
  /** Validation only: count message UI slot renders directly (adds a component to every row). */
  groundTruth: boolean;
  /** Validation only: a deliberate leak, to prove M-MEM catches one (roadmap step 15). */
  leak: 'messages' | 'detached' | null;
  /** Validation only: event types the client never sees, to prove a gate catches ignored events. */
  dropEvents: string[];
};

/** The livestream message cap the protocol pins (WEB-SCENARIOS.md §1.2b); messaging is uncapped. */
export const LIVESTREAM_CAP = 230;
export const DEFAULT_PAGE_SIZE = 30;

const KNOWN_PARAMS = new Set([
  'ground_truth',
  'api_key',
  'token',
  'user_id',
  'list',
  'type',
  'cap',
  'page_size',
  'leak',
  'drop_events',
]);

export class ConfigError extends Error {}

const oneOf = <T extends string>(
  name: string,
  value: string | null,
  allowed: readonly T[],
): T => {
  if (value === null)
    throw new ConfigError(`missing required ?${name}= (one of: ${allowed.join(', ')})`);
  if (!(allowed as readonly string[]).includes(value)) {
    throw new ConfigError(
      `unknown ?${name}=${value} (expected one of: ${allowed.join(', ')})`,
    );
  }
  return value as T;
};

const positiveInt = (name: string, value: string): number => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0)
    throw new ConfigError(`?${name}=${value} is not a positive integer`);
  return n;
};

export const parseConfig = (search: string): PerfHostConfig => {
  const params = new URLSearchParams(search);

  const unknown = [...params.keys()].filter((key) => !KNOWN_PARAMS.has(key));
  if (unknown.length) {
    throw new ConfigError(`unknown URL parameter(s): ${unknown.join(', ')}`);
  }

  const apiKey = params.get('api_key');
  const token = params.get('token');
  if (!apiKey) throw new ConfigError('missing required ?api_key=');
  if (!token) throw new ConfigError('missing required ?token= (chatperf token qatest1)');

  const list = oneOf('list', params.get('list'), ['standard', 'virtualized'] as const);
  const type = oneOf('type', params.get('type') ?? 'messaging', [
    'messaging',
    'livestream',
  ] as const);

  const canonicalCap: number | 'none' = type === 'livestream' ? LIVESTREAM_CAP : 'none';
  const capParam = params.get('cap');
  const cap: number | 'none' =
    capParam === null
      ? canonicalCap
      : capParam === 'none'
        ? 'none'
        : positiveInt('cap', capParam);

  const pageSizeParam = params.get('page_size');

  return {
    apiKey,
    token,
    userId: params.get('user_id') ?? 'qatest1',
    list,
    type,
    cap,
    capIsCanonical: cap === canonicalCap,
    groundTruth: params.get('ground_truth') === '1',
    leak: params.has('leak')
      ? oneOf('leak', params.get('leak'), ['messages', 'detached'] as const)
      : null,
    dropEvents: (params.get('drop_events') ?? '').split(',').filter(Boolean),
    pageSize:
      pageSizeParam === null
        ? DEFAULT_PAGE_SIZE
        : positiveInt('page_size', pageSizeParam),
  };
};
