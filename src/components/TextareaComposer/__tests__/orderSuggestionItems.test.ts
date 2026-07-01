import { fromPartial } from '@total-typescript/shoehorn';

import { orderSuggestionItems } from '../SuggestionList';

import type { TextComposerSuggestion } from 'stream-chat';

const command = (name: string) => fromPartial<TextComposerSuggestion>({ id: name, name });

describe('orderSuggestionItems', () => {
  it('sorts command suggestions alphabetically by name', () => {
    const items = [command('mute'), command('ban'), command('giphy')];
    expect(orderSuggestionItems(items, 'commands').map((i) => i.name)).toEqual([
      'ban',
      'giphy',
      'mute',
    ]);
  });

  it('keeps non-command suggestions in their original order', () => {
    const items = [command('mute'), command('ban'), command('giphy')];
    expect(orderSuggestionItems(items, 'mentions').map((i) => i.name)).toEqual([
      'mute',
      'ban',
      'giphy',
    ]);
  });

  it('does not mutate the source array', () => {
    const items = [command('mute'), command('ban')];
    orderSuggestionItems(items, 'commands');
    expect(items.map((i) => i.name)).toEqual(['mute', 'ban']);
  });

  it('returns an empty array for missing items', () => {
    expect(orderSuggestionItems(undefined, 'commands')).toEqual([]);
    expect(orderSuggestionItems(undefined, 'mentions')).toEqual([]);
  });

  it('maps the highlighted index to the same command the list renders (the activedescendant/Enter invariant)', () => {
    // Raw search-source order differs from the rendered (sorted) order. The list assigns
    // option ids and highlights `focusedItemIndex` against the sorted array; the composer's Enter
    // handler must resolve the same array so the announced option is the one inserted.
    const raw = [command('mute'), command('ban'), command('giphy')];
    const ordered = orderSuggestionItems(raw, 'commands');
    const focusedItemIndex = 0; // the SR announces "ban" (first sorted option)
    expect(ordered[focusedItemIndex].name).toBe('ban');
    // Selecting from the raw order at the same index would have inserted the wrong command.
    expect(raw[focusedItemIndex].name).toBe('mute');
  });
});
