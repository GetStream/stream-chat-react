import { Streami18n } from '../Streami18n';

/**
 * The two bundled `relativeCompact` keys must render the labels this SDK rendered before its
 * formatter moved into `stream-chat`, whose default rounding differs.
 */
describe('relativeCompact week labels', () => {
  const NOW = new Date('2026-04-30T12:00:00.000Z');
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const at = (daysAgo: number) => new Date(NOW.getTime() - daysAgo * 24 * 3600 * 1000);

  it.each([
    [7, '1w ago'],
    [8, '2w ago'],
    [14, '2w ago'],
    [15, '3w ago'],
    [21, '3w ago'],
  ])('renders %i days ago as %s', async (daysAgo, expected) => {
    const i18n = new Streami18n({ logger: () => null });
    const { t } = await i18n.init();
    expect(t('timestamp.PollVote', { timestamp: at(daysAgo) })).toBe(expected);
    expect(t('timestamp.ChannelMembersLastActive', { timestamp: at(daysAgo) })).toBe(
      expected,
    );
  });

  it('falls through to a date past 21 days, as it did before', async () => {
    const i18n = new Streami18n({ logger: () => null });
    const { t } = await i18n.init();
    expect(t('timestamp.PollVote', { timestamp: at(22) })).toMatch(
      /^\d{2}\/\d{2}\/\d{2}$/,
    );
    expect(t('timestamp.PollVote', { timestamp: at(27) })).toMatch(
      /^\d{2}\/\d{2}\/\d{2}$/,
    );
  });
});
