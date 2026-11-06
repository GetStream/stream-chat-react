import { markdownToPlainText } from '../previewText';

// A plugin that throws while transforming, so the strip falls back to the raw text.
vi.mock('../../Message/renderText/remarkPlugins', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../Message/renderText/remarkPlugins')>()),
  htmlToTextPlugin: () => () => {
    throw new Error('plugin failed');
  },
}));

describe('markdownToPlainText when the markdown pipeline throws', () => {
  it('returns the raw text on one line', () => {
    expect(markdownToPlainText('**done**\n\nnext', 'display')).toBe('**done** next');
    expect(markdownToPlainText('**done**\n\nnext', 'announcement')).toBe('**done** next');
  });
});
