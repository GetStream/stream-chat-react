import { render } from '@testing-library/react';
import { loadDefaultExtendedReactionOptions } from '../reactions';
import { emojiToUnicode } from '../../../components/Reactions/reactionOptions';

describe('loadDefaultExtendedReactionOptions', () => {
  it('builds an extended reaction map covering the full emoji dataset', async () => {
    const extended = await loadDefaultExtendedReactionOptions();

    // The full vendored set (~1,870 emoji) — far beyond the handful of quick reactions,
    // so the picker's "+" list lets you react with essentially any emoji again.
    expect(Object.keys(extended).length).toBeGreaterThan(1000);
  });

  it('keys entries by unicode and renders the native glyph', async () => {
    const extended = await loadDefaultExtendedReactionOptions();
    const grinningUnicode = emojiToUnicode('😀'); // U+1F600

    const entry = extended[grinningUnicode];
    expect(entry).toBeDefined();
    expect(entry.unicode).toBe(grinningUnicode);

    const { container } = render(<entry.Component />);
    expect(container).toHaveTextContent('😀');
  });

  it('memoizes: repeated calls resolve the same map (no rebuild per reaction render)', async () => {
    const first = await loadDefaultExtendedReactionOptions();
    const second = await loadDefaultExtendedReactionOptions();

    expect(first).toBe(second);
  });
});
