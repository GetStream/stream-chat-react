import type { TextComposerMiddlewareExecutorState } from 'stream-chat';

import { createTextComposerEmojiMiddleware } from '../textComposerEmojiMiddleware';
import type { EmojiSuggestion } from '../textComposerEmojiMiddleware';

const emojiSearchIndex = { search: vi.fn().mockResolvedValue([]) };

const runOnChange = async (
  middleware: ReturnType<typeof createTextComposerEmojiMiddleware>,
  text: string,
) => {
  const complete = vi.fn();
  const forward = vi.fn();
  const next = vi.fn();
  await middleware.handlers.onChange({
    complete,
    discard: vi.fn(),
    forward,
    next,
    state: {
      selection: { end: text.length, start: text.length },
      text,
    } as TextComposerMiddlewareExecutorState<EmojiSuggestion>,
  });
  return { complete, next };
};

describe('createTextComposerEmojiMiddleware', () => {
  it('suggests emojis for the default trigger', async () => {
    const middleware = createTextComposerEmojiMiddleware(emojiSearchIndex);
    const { complete } = await runOnChange(middleware, ':sm');

    expect(complete).toHaveBeenCalledWith(
      expect.objectContaining({
        suggestions: expect.objectContaining({ query: 'sm', trigger: ':' }),
      }),
    );
  });

  it('does not leak the options of one middleware into the defaults of the next', async () => {
    const customMiddleware = createTextComposerEmojiMiddleware(emojiSearchIndex, {
      trigger: ';',
    });
    const { complete: customComplete } = await runOnChange(customMiddleware, ';sm');
    expect(customComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        suggestions: expect.objectContaining({ trigger: ';' }),
      }),
    );

    const defaultMiddleware = createTextComposerEmojiMiddleware(emojiSearchIndex);
    const { complete } = await runOnChange(defaultMiddleware, ':sm');

    expect(complete).toHaveBeenCalledWith(
      expect.objectContaining({
        suggestions: expect.objectContaining({ trigger: ':' }),
      }),
    );
  });
});
