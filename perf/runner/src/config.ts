// The configuration grid (WEB-SCENARIOS.md §1.3): build × channel type × list × column.
// Every number the runner reports is tied to one cell of it.

export type Build = 'dev' | 'prod';
export type ChannelType = 'messaging' | 'livestream';
export type ListImplementation = 'standard' | 'virtualized';
export type Column = 'chrome-desktop' | 'chrome-4x';

export const BUILDS: readonly Build[] = ['dev', 'prod'];
export const CHANNEL_TYPES: readonly ChannelType[] = ['messaging', 'livestream'];
export const LISTS: readonly ListImplementation[] = ['standard', 'virtualized'];

export const COLUMNS: Record<Column, { cpuThrottle: number }> = {
  'chrome-4x': { cpuThrottle: 4 },
  'chrome-desktop': { cpuThrottle: 1 },
};

/** Pinned window, so layout cost is the same on every run (WEB-SCENARIOS.md §1.2b). */
export const VIEWPORT = { height: 900, width: 1440 };
export const DEVICE_SCALE_FACTOR = 2;

/** The protocol's cap per channel type; the host derives the same from `type`. */
export const capFor = (type: ChannelType) => (type === 'livestream' ? '230' : 'none');
