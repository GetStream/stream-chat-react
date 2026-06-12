import { describe, expect, it } from 'vitest';

import {
  filterRenderTextMentionEntitiesByChannelCapabilities,
  isMentionTypeAllowedByChannelCapabilities,
} from '../mentionCapabilities';

const ALL_NOTIFY_CAPABILITIES = {
  'notify-channel': true,
  'notify-group': true,
  'notify-here': true,
  'notify-role': true,
};

describe('mentionCapabilities', () => {
  it('should always allow user mentions', () => {
    expect(isMentionTypeAllowedByChannelCapabilities('user', {})).toBe(true);
  });

  it('should gate broadcast mention types by channel capabilities', () => {
    expect(isMentionTypeAllowedByChannelCapabilities('channel', {})).toBe(false);
    expect(
      isMentionTypeAllowedByChannelCapabilities('channel', ALL_NOTIFY_CAPABILITIES),
    ).toBe(true);
    expect(
      isMentionTypeAllowedByChannelCapabilities('role', { 'notify-role': true }),
    ).toBe(true);
  });

  it('should filter render text mention entities by channel capabilities', () => {
    const entities = [
      { id: 'channel', mentionType: 'channel' as const, name: 'channel' as const },
      { id: 'admin', mentionType: 'role' as const, name: 'admin' },
    ];

    expect(
      filterRenderTextMentionEntitiesByChannelCapabilities(entities, {
        'notify-role': true,
      }),
    ).toEqual([{ id: 'admin', mentionType: 'role', name: 'admin' }]);
  });
});
