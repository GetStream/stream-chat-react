import type { VoiceRecordingAttachment } from 'stream-chat';

import {
  getPlainPreviewText,
  markdownToPlainText,
  stripMarkdownToText,
} from '../previewText';
import {
  generateFileAttachment,
  generateMessage,
  generateVideoAttachment,
} from '../../../mock-builders';

describe('stripMarkdownToText', () => {
  it.each([
    ['bold', 'marking this sprint item **done**', 'marking this sprint item done'],
    ['emphasis and strikethrough', '_soon_ and ~~never~~', 'soon and never'],
    ['a link', 'see [the docs](https://example.test/docs)', 'see the docs'],
    ['inline code', 'run `yarn build` first', 'run yarn build first'],
    ['a fenced code block', '```\nconst a = 1;\n```', 'const a = 1;'],
    ['a heading', '# Release notes', 'Release notes'],
  ])('strips %s', (_, text, expected) => {
    expect(stripMarkdownToText(text)).toBe(expected);
  });

  it('keeps words of separate paragraphs and list items apart', () => {
    expect(stripMarkdownToText('first\n\nsecond')).toBe('first second');
    expect(stripMarkdownToText('- one\n- two\n  - nested')).toBe('one two nested');
    expect(stripMarkdownToText('> quoted\n\nreply')).toBe('quoted reply');
  });

  it('keeps the numbers of ordered list items', () => {
    expect(stripMarkdownToText('3. done\n4. next')).toBe('3. done 4. next');
    expect(stripMarkdownToText('1986. A great year')).toBe('1986. A great year');
  });

  it('keeps words on either side of a hard line break apart', () => {
    expect(stripMarkdownToText('line1  \nline2')).toBe('line1 line2');
    expect(stripMarkdownToText('line1\\\nline2')).toBe('line1 line2');
  });

  it('reads line breaks and empty list items as single spaces', () => {
    expect(stripMarkdownToText('first\nsecond')).toBe('first second');
    expect(stripMarkdownToText('1.\n2. b')).toBe('1. 2. b');
  });

  it('keeps the paragraphs of a footnote apart', () => {
    expect(stripMarkdownToText('a[^1]\n\n[^1]: note one\n\n    note two')).toBe(
      'a note one note two',
    );
  });

  it('reads a table row by row, header first, with its cells as words', () => {
    expect(
      stripMarkdownToText(
        '| Name | Status |\n| --- | --- |\n| API | **done** |\n| UI | `wip` |',
      ),
    ).toBe('Name Status API done UI wip');
  });

  it('reads task list items without their checkboxes', () => {
    expect(stripMarkdownToText('- [x] ship v15\n- [ ] write docs')).toBe(
      'ship v15 write docs',
    );
  });

  it('shows an image as its URL, as the message list links it', () => {
    expect(stripMarkdownToText('![diagram](https://example.test/a.png) see above')).toBe(
      'https://example.test/a.png see above',
    );
  });

  it('keeps inline HTML as literal text and decodes entities', () => {
    expect(stripMarkdownToText('a <b>bold</b> tag &amp; entity')).toBe(
      'a <b>bold</b> tag & entity',
    );
  });

  it('returns the raw text when stripping leaves nothing', () => {
    expect(stripMarkdownToText('---')).toBe('---');
  });
});

describe('markdownToPlainText in the display format', () => {
  const toDisplayText = (text: string) => markdownToPlainText(text, 'display');

  it('keeps list bullets and ordered numbers', () => {
    expect(toDisplayText('- one\n- two\n  - nested')).toBe('- one - two - nested');
    expect(toDisplayText('* star\n+ plus')).toBe('- star - plus');
    expect(toDisplayText('3. done\n4. next')).toBe('3. done 4. next');
  });

  it('keeps task checkboxes', () => {
    expect(toDisplayText('- [x] ship v15\n- [ ] write docs')).toBe(
      '- [x] ship v15 - [ ] write docs',
    );
  });

  it('keeps table cell separators, drops the delimiter row and strips cell markdown', () => {
    expect(
      toDisplayText('| Name | Status |\n| --- | --- |\n| API | **done** |\n| UI | |'),
    ).toBe('| Name | Status | | API | done | | UI | |');
  });

  it('numbers ordered task items and reads [X] as a checked box', () => {
    expect(toDisplayText('1. [x] done\n2. [ ] todo\n3. [X] also')).toBe(
      '1. [x] done 2. [ ] todo 3. [x] also',
    );
    expect(markdownToPlainText('1. [x] done\n2. [ ] todo', 'announcement')).toBe(
      '1. done 2. todo',
    );
  });

  it('keeps markers of lists and tables nested in quotes and list items', () => {
    expect(toDisplayText('> - one\n> - two')).toBe('- one - two');
    expect(toDisplayText('5. five\n   - nested\n6. six')).toBe('5. five - nested 6. six');
    expect(toDisplayText('- item\n\n  | a | b |\n  | - | - |\n  | 1 | 2 |')).toBe(
      '- item | a | b | | 1 | 2 |',
    );
  });

  it('keeps an escaped pipe inside a cell escaped', () => {
    expect(toDisplayText('| a \\| b | c |\n| - | - |')).toBe('| a \\| b | c |');
  });

  it('returns the raw text on one line when stripping leaves nothing', () => {
    expect(markdownToPlainText('---\n\n---', 'display')).toBe('--- ---');
  });

  it('strips inline markdown around lists and tables', () => {
    expect(toDisplayText('**Deploy** status:\n\n- [x] [ship](https://x.test)')).toBe(
      'Deploy status: - [x] ship',
    );
  });
});

describe('getPlainPreviewText', () => {
  it('keeps list markers in the display format and reads words in the announcement format', () => {
    const latestMessage = generateMessage({ text: '- [x] ship\n- [ ] docs' });
    const params = {
      latestMessage,
      text: '- [x] ship\n- [ ] docs',
      type: 'text' as const,
      userLanguage: 'en',
    };
    expect(getPlainPreviewText({ ...params, format: 'display' })).toBe(
      '- [x] ship - [ ] docs',
    );
    expect(getPlainPreviewText({ ...params, format: 'announcement' })).toBe('ship docs');
  });

  it('strips markdown from the message text', () => {
    const latestMessage = generateMessage({ text: 'item **done**' });
    expect(
      getPlainPreviewText({
        format: 'display',
        latestMessage,
        text: 'item **done**',
        type: 'text',
        userLanguage: 'en',
      }),
    ).toBe('item done');
  });

  it('keeps AI-generated text verbatim, as the channel row announces it', () => {
    const latestMessage = generateMessage({ text: '**keep me**' });
    expect(
      getPlainPreviewText({
        format: 'display',
        isMessageAIGenerated: () => true,
        latestMessage,
        text: '**keep me**',
        type: 'text',
        userLanguage: 'en',
      }),
    ).toBe('**keep me**');
  });

  it('strips the translated text the preview shows', () => {
    const latestMessage = generateMessage({
      i18n: { fr_text: '**fait**' } as never,
      text: '**done**',
    });
    expect(
      getPlainPreviewText({
        format: 'display',
        latestMessage,
        text: '**fait**',
        type: 'text',
        userLanguage: 'fr',
      }),
    ).toBe('fait');
  });

  it('strips the caption of an attachment and keeps the duration suffix', () => {
    const latestMessage = generateMessage({
      attachments: [
        generateVideoAttachment({
          custom: { duration: 125 },
        } as Partial<VoiceRecordingAttachment>),
      ],
      text: 'look at **this**',
    });
    expect(
      getPlainPreviewText({
        format: 'display',
        latestMessage,
        text: 'look at **this** (2:05)',
        type: 'video',
        userLanguage: 'en',
      }),
    ).toBe('look at this (2:05)');
  });

  it('keeps an attachment title that is not the message text', () => {
    const latestMessage = generateMessage({
      attachments: [generateFileAttachment({ title: '__init__.py' })],
      text: '',
    });
    expect(
      getPlainPreviewText({
        format: 'display',
        latestMessage,
        text: '__init__.py',
        type: 'file',
        userLanguage: 'en',
      }),
    ).toBe('__init__.py');
  });

  it('keeps the GIPHY title and system strings as they are', () => {
    const latestMessage = generateMessage({ text: '**giphy**' });
    expect(
      getPlainPreviewText({
        format: 'display',
        latestMessage,
        text: '**giphy**',
        type: 'giphy',
        userLanguage: 'en',
      }),
    ).toBe('**giphy**');
    expect(
      getPlainPreviewText({
        format: 'display',
        latestMessage,
        text: 'Message deleted',
        type: 'deleted',
        userLanguage: 'en',
      }),
    ).toBe('Message deleted');
  });

  it('returns the text as is without a message', () => {
    expect(
      getPlainPreviewText({
        format: 'display',
        latestMessage: undefined,
        text: 'Nothing yet...',
        type: 'empty',
        userLanguage: 'en',
      }),
    ).toBe('Nothing yet...');
  });
});
