import type { LocalMessage } from 'stream-chat';
import type { List, ListItem, Nodes, TableRow } from 'mdast';
import { toString as mdastToString } from 'mdast-util-to-string';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import type { PluggableList } from 'unified';
import { unified } from 'unified';

import type { ChatContextValue } from '../../context/ChatContext';
import { getTranslatedMessageText } from '../../context/MessageTranslationViewContext';
import type { TranslationContextValue } from '../../context/TranslationContext';
import {
  htmlToTextPlugin,
  imageToLink,
  plusPlusToEmphasis,
} from '../Message/renderText/remarkPlugins';
import type { ChannelPreviewMessageType } from './hooks/useLatestMessagePreview';

/** Remark plugins of the latest-message preview, shared by its markdown and plain-text forms. */
export const previewRemarkPlugins: PluggableList = [
  htmlToTextPlugin,
  [remarkGfm, { singleTilde: false }],
  plusPlusToEmphasis,
  imageToLink,
];

// The processor is built lazily so importing this file does not build it: building fails when a
// test file mocks the plugin modules.
const createPlainTextProcessor = () =>
  unified().use(remarkParse).use(previewRemarkPlugins);
let plainTextProcessor: ReturnType<typeof createPlainTextProcessor> | undefined;

/**
 * How plain text is read:
 * - `display`: the visible one-line preview. Lists keep their markers (`-`, `1.`, `[x]`) and tables
 *   their `|` cell separators, so the reader can tell what the message contains.
 * - `announcement`: text read by screen readers. Only the words are kept, plus the numbers of
 *   ordered list items.
 */
export type PlainTextFormat = 'announcement' | 'display';

/**
 * Nodes whose children are blocks (paragraphs, list items, rows), read as words apart. Lists, and
 * tables in the `display` format, are read by their own branches of {@link toPlainText} first.
 */
const blockContainerTypes = new Set<Nodes['type']>([
  'blockquote',
  'footnoteDefinition',
  'listItem',
  'root',
  'table',
  'tableRow',
]);

const joinAsWords = (parts: string[]) => parts.filter(Boolean).join(' ');

/** Whether the list item is a task (`- [x]` or `- [ ]`). */
const isTaskItem = (item: ListItem) => typeof item.checked === 'boolean';

/** The number of an ordered list item ("3."), counted from the list's `start`. */
const getOrderedItemNumber = (list: List, index: number) =>
  `${(list.start ?? 1) + index}.`;

/**
 * The marker read before a list item. Ordered items keep their number ("3. done") in both formats,
 * as the message list shows them. The `display` format also shows the bullet of an unordered item
 * and the checkbox of a task item.
 */
const getListItemMarker = (
  list: List,
  item: ListItem,
  index: number,
  format: PlainTextFormat,
): string => {
  const number = list.ordered ? getOrderedItemNumber(list, index) : undefined;
  if (format === 'announcement') return number ?? '';
  const checkbox = isTaskItem(item) ? (item.checked ? '[x]' : '[ ]') : '';
  return joinAsWords([number ?? '-', checkbox]);
};

/**
 * A table row in the `display` format, its cells between `|` separators: `| API | done |`. The
 * result is plain text, not markdown, so cell text is shown as is, a `|` inside a cell included.
 */
const tableRowToDisplayText = (row: TableRow) =>
  `| ${row.children.map((cell) => toPlainText(cell, 'display')).join(' | ')} |`;

/**
 * Reads a markdown node as text in the given format. Block containers join their children as
 * words; inline content is concatenated.
 */
const toPlainText = (node: Nodes, format: PlainTextFormat): string => {
  if (node.type === 'list') {
    return joinAsWords(
      node.children.map((item, index) =>
        joinAsWords([
          getListItemMarker(node, item, index, format),
          toPlainText(item, format),
        ]),
      ),
    );
  }
  if (node.type === 'table' && format === 'display') {
    return joinAsWords(node.children.map(tableRowToDisplayText));
  }
  if (blockContainerTypes.has(node.type) && 'children' in node) {
    return joinAsWords(node.children.map((child) => toPlainText(child as Nodes, format)));
  }
  // A hard line break separates words; `mdastToString` reads it as nothing.
  if (node.type === 'break') return ' ';
  if ('children' in node) {
    return node.children.map((child) => toPlainText(child as Nodes, format)).join('');
  }
  return mdastToString(node);
};

const collapseWhitespace = (text: string) => text.replace(/\s+/g, ' ').trim();

/**
 * Strips markdown syntax from message text with the preview's remark plugins, in the given
 * {@link PlainTextFormat}. Blocks such as paragraphs and list items are joined with a space, and
 * line breaks read as spaces. When processing throws or yields nothing, returns the raw text on
 * one line.
 */
export const markdownToPlainText = (text: string, format: PlainTextFormat): string => {
  try {
    const processor = (plainTextProcessor ??= createPlainTextProcessor());
    const plainText = toPlainText(
      processor.runSync(processor.parse(text)) as Nodes,
      format,
    );
    return collapseWhitespace(plainText) || collapseWhitespace(text) || text;
  } catch {
    return collapseWhitespace(text) || text;
  }
};

/**
 * {@link markdownToPlainText} in the `announcement` format, for text read by screen readers:
 * `**done**` reads as `done`, `[docs](https://…)` as `docs`, and list bullets, task checkboxes and
 * table separators are dropped.
 */
export const stripMarkdownToText = (text: string): string =>
  markdownToPlainText(text, 'announcement');

/** Preview types whose text is never the message text: system strings and the GIPHY title. */
const typesWithoutMessageText = new Set<ChannelPreviewMessageType>([
  'deleted',
  'empty',
  'error',
  'giphy',
  'poll',
]);

/** Whether a preview of this type can show the message text (or a caption) at all. */
const previewTypeMayShowMessageText = (type: ChannelPreviewMessageType) =>
  !typesWithoutMessageText.has(type);

export type GetPlainPreviewTextParams = {
  /** `display` for the visible preview, `announcement` for text read by screen readers. */
  format: PlainTextFormat;
  /** AI-generated text is returned verbatim, as the row labels read it. */
  isMessageAIGenerated?: ChatContextValue['isMessageAIGenerated'];
  /** Message the preview was built from. */
  latestMessage: LocalMessage | undefined;
  /** Preview text from `useLatestMessagePreview`. */
  text: string;
  /** Preview type from `useLatestMessagePreview`. */
  type: ChannelPreviewMessageType;
  userLanguage: TranslationContextValue['userLanguage'];
};

/**
 * The `useLatestMessagePreview` text as plain text in the given format. When the preview starts
 * with the message text, that part loses its markdown syntax and the rest (an attachment's
 * duration) stays. Labels, attachment titles, system strings and AI-generated text are returned as
 * they are.
 */
export const getPlainPreviewText = ({
  format,
  isMessageAIGenerated,
  latestMessage,
  text,
  type,
  userLanguage,
}: GetPlainPreviewTextParams): string => {
  if (
    !latestMessage ||
    !previewTypeMayShowMessageText(type) ||
    isMessageAIGenerated?.(latestMessage)
  )
    return text;
  const messageText =
    getTranslatedMessageText({ language: userLanguage, message: latestMessage }) ||
    latestMessage.text;
  // The preview shows the message text (or a caption), optionally followed by a duration, when it
  // starts with it; otherwise it shows an attachment's title or a generic label.
  if (!messageText || !text.startsWith(messageText)) return text;
  return markdownToPlainText(messageText, format) + text.slice(messageText.length);
};
