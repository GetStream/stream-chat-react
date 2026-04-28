import { getTypingStatusMessage } from '../getTypingStatusMessage';

import type { TypingEntry } from '../../hooks/useDebouncedTypingActive';

const translate = (value: string, options?: Record<string, number | string>) =>
  Object.entries(options || {}).reduce(
    (result, [key, optionValue]) => result.replace(`{{ ${key} }}`, String(optionValue)),
    value,
  );

describe('getTypingStatusMessage', () => {
  it('formats a single typing user', () => {
    const displayUsers: TypingEntry[] = [{ user: { name: 'Jessica' } }];

    expect(getTypingStatusMessage(displayUsers, translate)).toBe('Jessica is typing');
  });

  it('formats two typing users', () => {
    const displayUsers: TypingEntry[] = [
      { user: { name: 'Jessica' } },
      { user: { name: 'Joris' } },
    ];

    expect(getTypingStatusMessage(displayUsers, translate)).toBe(
      'Jessica and Joris are typing',
    );
  });

  it('falls back to a count for 3+ users', () => {
    const displayUsers: TypingEntry[] = [
      { user: { name: 'Jessica' } },
      { user: { name: 'Joris' } },
      { user: { name: 'Margriet' } },
    ];

    expect(getTypingStatusMessage(displayUsers, translate)).toBe('3 people are typing');
  });

  it('falls back to user id when name is missing', () => {
    const displayUsers: TypingEntry[] = [{ user: { id: 'user-42' } }];

    expect(getTypingStatusMessage(displayUsers, translate)).toBe('user-42 is typing');
  });
});
