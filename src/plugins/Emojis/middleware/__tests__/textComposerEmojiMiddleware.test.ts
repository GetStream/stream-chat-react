import { createTextComposerEmojiMiddleware } from '../textComposerEmojiMiddleware';

// Minimal onChange harness: capture whatever state the handler completes/nexts with.
const runOnChange = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  middleware: ReturnType<typeof createTextComposerEmojiMiddleware>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let output: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const complete = (next: any) => {
    output = next;
    return { state: next, status: 'complete' };
  };
  const forward = vi.fn(() => ({ status: 'forward' }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const next = (nextState: any) => {
    output = nextState;
    return { state: nextState, status: 'next' };
  };
  await middleware.handlers.onChange({
    complete,
    forward,
    next,
    state,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  return { forward, output };
};

describe('createTextComposerEmojiMiddleware', () => {
  it('returns a middleware with the expected id and handlers when called with no arguments', () => {
    const middleware = createTextComposerEmojiMiddleware();
    expect(middleware.id).toBe('stream-io/emoji-middleware');
    expect(typeof middleware.handlers.onChange).toBe('function');
    expect(typeof middleware.handlers.onSuggestionItemSelect).toBe('function');
  });

  it('drives ":" shortcode autocomplete from the built-in index (no emoji-mart)', async () => {
    const middleware = createTextComposerEmojiMiddleware();
    const { output } = await runOnChange(middleware, {
      selection: { end: 4, start: 4 },
      suggestions: undefined,
      text: ':smi',
    });

    expect(output?.suggestions?.trigger).toBe(':');
    expect(output?.suggestions?.query).toBe('smi');

    const { items } = await output.suggestions.searchSource.query('smi');
    expect(items.length).toBeGreaterThan(0);
    // e.g. "smile" / "smiley" — proves the default search index is wired in
    expect(items.some((item: { id: string }) => item.id.startsWith('smi'))).toBe(true);
  });

  it('forwards when there is no selection', async () => {
    const middleware = createTextComposerEmojiMiddleware();
    const { forward } = await runOnChange(middleware, {
      selection: null,
      suggestions: undefined,
      text: '',
    });
    expect(forward).toHaveBeenCalled();
  });

  it('accepts a custom EmojiSearchIndex override', async () => {
    const search = vi.fn().mockResolvedValue([
      { emoticons: [], id: 'custom', name: 'Custom', native: '🦄', skins: [{ native: '🦄' }] },
    ]);
    const middleware = createTextComposerEmojiMiddleware({ search });
    const { output } = await runOnChange(middleware, {
      selection: { end: 4, start: 4 },
      suggestions: undefined,
      text: ':uni',
    });
    const { items } = await output.suggestions.searchSource.query('uni');
    expect(search).toHaveBeenCalled();
    expect(items[0]?.id).toBe('custom');
  });
});
