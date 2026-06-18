import React from 'react';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import { find } from 'linkifyjs';
import remarkGfm from 'remark-gfm';
import type { ComponentType, JSX, ReactNode } from 'react';
import type { Options } from 'react-markdown';
import type { UserResponse } from 'stream-chat';
import type { PluggableList } from 'unified'; // A sub-dependency of react-markdown. The type is not declared or re-exported from anywhere else

import { Anchor, Emoji, Mention } from './componentRenderers';
import { detectHttp, matchMarkdownLinks, messageCodeBlocks } from './regex';
import {
  createMentionPluginAndDisplayTextSet,
  emojiMarkdownPlugin,
  getRenderTextMentionEntities,
} from './rehypePlugins';
import {
  htmlToTextPlugin,
  imageToLink,
  keepLineBreaksPlugin,
  plusPlusToEmphasis,
} from './remarkPlugins';
import { ErrorBoundary } from '../../UtilityComponents';
import type { MentionProps } from './componentRenderers/Mention';
import type { RenderTextMentionEntity } from './rehypePlugins';

export type RenderTextPluginConfigurator = (
  defaultPlugins: PluggableList,
) => PluggableList;

type IntrinsicElementTagName = keyof JSX.IntrinsicElements & string;

export const defaultAllowedTagNames: Array<
  IntrinsicElementTagName | 'emoji' | 'mention'
> = [
  'html',
  'text',
  'br',
  'p',
  'em',
  'strong',
  'a',
  'ol',
  'ul',
  'li',
  'code',
  'pre',
  'blockquote',
  'del',
  'table',
  'thead',
  'tbody',
  'th',
  'tr',
  'td',
  'tfoot',
  // custom types (tagNames)
  'emoji',
  'mention',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ins',
];

function formatUrlForDisplay(url: string) {
  try {
    return decodeURIComponent(url).replace(detectHttp, '');
  } catch (e) {
    return url;
  }
}

function encodeDecode(url: string) {
  try {
    return encodeURI(decodeURIComponent(url));
  } catch (error) {
    return url;
  }
}

const urlTransform = (uri: string) =>
  uri.startsWith('app://') ? uri : defaultUrlTransform(uri);

const getPluginsForward: RenderTextPluginConfigurator = (plugins: PluggableList) =>
  plugins;

export const markDownRenderers: RenderTextOptions['customMarkDownRenderers'] = {
  a: Anchor,
  emoji: Emoji,
  mention: Mention,
};

export type RenderTextOptions = {
  allowedTagNames?: Array<IntrinsicElementTagName | 'emoji' | 'mention' | (string & {})>;
  customMarkDownRenderers?: Options['components'] &
    Partial<{
      emoji: ComponentType;
      mention: ComponentType<MentionProps>;
    }>;
  getRehypePlugins?: RenderTextPluginConfigurator;
  getRemarkPlugins?: RenderTextPluginConfigurator;
  /**
   * Additive mention metadata for rendered message text.
   *
   * Prefer this over the deprecated `mentionedUsers` argument. Use it whenever
   * the message contains mention kinds beyond direct-user mentions
   * (for example `@channel`, `@here`, roles, or user groups) and `renderText`
   * needs the exact mention entities that should be highlighted in the rendered
   * markdown output.
   */
  messageMentionEntities?: RenderTextMentionEntity[];
};

export type RenderTextFunction = (
  text?: string,
  /**
   * @deprecated Pass mention metadata through `options.messageMentionEntities`
   * instead. This argument only supports direct-user mentions. Will be removed in next major version.
   */
  mentionedUsers?: UserResponse[],
  options?: RenderTextOptions,
) => ReactNode;

export function renderText(
  text?: string,
  /**
   * @deprecated Pass mention metadata through `options.messageMentionEntities`
   * instead. This argument only supports direct-user mentions.
   */
  mentionedUsers?: UserResponse[],
  {
    allowedTagNames = defaultAllowedTagNames,
    customMarkDownRenderers,
    getRehypePlugins = getPluginsForward,
    getRemarkPlugins = getPluginsForward,
    messageMentionEntities,
  }: RenderTextOptions = {},
) {
  // take the @ mentions and turn them into markdown?
  // translate links
  if (!text) return null;
  if (text.trim().length === 1) return <>{text}</>;

  let newText = text;
  const renderTextMentionEntities =
    messageMentionEntities ??
    getRenderTextMentionEntities({ mentioned_users: mentionedUsers });
  const { mentionDisplayTextSet, plugin: mentionsPlugin } =
    createMentionPluginAndDisplayTextSet(renderTextMentionEntities);
  const markdownLinks = matchMarkdownLinks(newText);
  const codeBlocks = messageCodeBlocks(newText);

  // Extract all valid links/emails within text and replace it with proper markup
  // Revert the link order to avoid getting out of sync of the original start and end positions of links
  // - due to the addition of new characters when creating Markdown links
  const links = [...find(newText, 'email'), ...find(newText, 'url')];
  for (let i = links.length - 1; i >= 0; i--) {
    const { end, href, start, type, value } = links[i];
    const linkIsInBlock = codeBlocks.some((block) => block?.includes(value));

    // check if message is already  markdown
    const noParsingNeeded =
      markdownLinks &&
      markdownLinks.filter((text) => {
        const strippedHref = href?.replace(detectHttp, '');
        const strippedText = text?.replace(detectHttp, '');

        if (!strippedHref || !strippedText) return false;

        return strippedHref.includes(strippedText) || strippedText.includes(strippedHref);
      });

    if (noParsingNeeded.length > 0 || linkIsInBlock) continue;

    try {
      // special case for mentions:
      // it could happen that a mention display text matches with an e-mail-like pattern.
      // in that case, we check whether the found e-mail is actually a mention
      // by naively checking for an existence of @ sign in front of it.
      if (type === 'email') {
        const mentionDisplayText = `@${value}`;
        if (mentionDisplayTextSet.has(mentionDisplayText)) {
          // FIXME: breaks if the mention symbol is not '@'
          const isMention = newText.charAt(start - 1) === '@';
          // in case of mention, we leave the match in its original form,
          // and we let `mentionsMarkdownPlugin` to do its job
          newText =
            newText.slice(0, start) +
            (isMention ? value : `[${value}](${encodeDecode(href)})`) +
            newText.slice(end);
        }
      } else {
        const displayLink = type === 'email' ? value : formatUrlForDisplay(href);

        newText =
          newText.slice(0, start) +
          `[${displayLink}](${encodeDecode(href)})` +
          newText.slice(end);
      }
    } catch (e) {
      void e;
    }
  }

  const remarkPlugins: PluggableList = [
    htmlToTextPlugin,
    keepLineBreaksPlugin,
    [remarkGfm, { singleTilde: false }],
    plusPlusToEmphasis,
    imageToLink,
  ];
  const rehypePlugins: PluggableList = [emojiMarkdownPlugin];

  if (renderTextMentionEntities.length) {
    rehypePlugins.push(mentionsPlugin);
  }

  return (
    <ErrorBoundary fallback={<>{text}</>}>
      <ReactMarkdown
        allowedElements={allowedTagNames}
        components={{
          ...markDownRenderers,
          ...customMarkDownRenderers,
        }}
        rehypePlugins={getRehypePlugins(rehypePlugins)}
        remarkPlugins={getRemarkPlugins(remarkPlugins)}
        skipHtml
        unwrapDisallowed
        urlTransform={urlTransform}
      >
        {newText}
      </ReactMarkdown>
    </ErrorBoundary>
  );
}
