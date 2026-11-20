import { filterScheduledMessagesByText } from '../scheduledMessageSearch';
import { generateScheduledMessage } from '../../../../mock-builders';

const launch = generateScheduledMessage({ message: { text: 'Launch moved to Monday' } });
const lunch = generateScheduledMessage({ message: { text: 'Lunch at noon' } });
const attachmentOnly = generateScheduledMessage({ message: { text: '' } });

const scheduledMessages = [launch, lunch, attachmentOnly];

describe('filterScheduledMessagesByText', () => {
  it('returns every message for an empty or blank query', () => {
    expect(filterScheduledMessagesByText(scheduledMessages)).toBe(scheduledMessages);
    expect(filterScheduledMessagesByText(scheduledMessages, '   ')).toBe(
      scheduledMessages,
    );
  });

  it('matches the message text case-insensitively', () => {
    expect(filterScheduledMessagesByText(scheduledMessages, 'MONDAY')).toEqual([launch]);
  });

  it('ignores surrounding whitespace in the query', () => {
    expect(filterScheduledMessagesByText(scheduledMessages, '  lunch ')).toEqual([lunch]);
  });

  it('returns no messages when nothing matches', () => {
    expect(filterScheduledMessagesByText(scheduledMessages, 'friday')).toEqual([]);
  });
});
