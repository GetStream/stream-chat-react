import { generateScheduledMessage } from '../../../../mock-builders';
import { matchesScheduledMessageText } from '../useScheduledMessagesSearch';

describe('matchesScheduledMessageText', () => {
  it('searches the text case-insensitively and ignores a blank query', () => {
    const lunch = generateScheduledMessage({
      message: { custom: {}, text: 'Lunch at noon' },
    });
    const launch = generateScheduledMessage({ message: { custom: {}, text: 'Launch' } });

    expect(matchesScheduledMessageText(lunch, ' LUNCH ')).toBe(true);
    expect(matchesScheduledMessageText(launch, ' LUNCH ')).toBe(false);
    expect(matchesScheduledMessageText(launch, '  ')).toBe(true);
  });
});
