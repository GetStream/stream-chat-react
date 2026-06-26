import type { ReactNode } from 'react';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Channel, LocalMessage, PollVote } from 'stream-chat';
import { toString as mdastToString } from 'mdast-util-to-string';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

import type { ChatContextValue } from '../../context';
import { getTranslatedMessageText } from '../../context/MessageTranslationViewContext';
import type { TranslationContextValue } from '../../context/TranslationContext';
import type { PluggableList } from 'unified';
import { htmlToTextPlugin, imageToLink, plusPlusToEmphasis } from '../Message';
import { isMessageDeleted } from '../Message/utils';
import remarkGfm from 'remark-gfm';

const remarkPlugins: PluggableList = [
  htmlToTextPlugin,
  [remarkGfm, { singleTilde: false }],
  plusPlusToEmphasis,
  imageToLink,
];

export const renderPreviewText = (text: string) => (
  <ReactMarkdown remarkPlugins={remarkPlugins} skipHtml>
    {text}
  </ReactMarkdown>
);

// Strips markdown to plain text for screen-reader announcements, using the SAME remark plugins as
// the visible preview so the announced text matches what is shown (e.g. "**hi**" -> "hi"). The
// processor is built lazily (not at module load) so importing this file never evaluates
// `remarkPlugins` — mirroring `renderPreviewText`, and avoiding import-time failures in test files
// that mock the plugin modules. Falls back to the raw text if processing throws.
const createPlainTextProcessor = () => unified().use(remarkParse).use(remarkPlugins);
let plainTextProcessor: ReturnType<typeof createPlainTextProcessor> | undefined;

const stripMarkdownToText = (text: string): string => {
  try {
    const processor = (plainTextProcessor ??= createPlainTextProcessor());
    return mdastToString(processor.runSync(processor.parse(text))) || text;
  } catch {
    return text;
  }
};

const getLatestPollVote = (latestVotesByOption: Record<string, PollVote[]>) => {
  let latestVote: PollVote | undefined;
  for (const optionVotes of Object.values(latestVotesByOption)) {
    optionVotes.forEach((vote) => {
      if (latestVote && new Date(latestVote.updated_at) >= new Date(vote.created_at))
        return;
      latestVote = vote;
    });
  }

  return latestVote;
};

type LatestMessagePreviewKind =
  | 'attachment'
  | 'command'
  | 'deleted'
  | 'empty'
  | 'location'
  | 'poll'
  | 'text';

type LatestMessagePreviewParts = {
  /**
   * True only for the plain user-message-text branch — the one the display variant renders as
   * markdown (unless AI-generated). Every other branch (deleted/poll/attachment/etc.) is a
   * localized phrase used verbatim.
   */
  isUserMessageText: boolean;
  /** What the latest message is, so consumers can phrase it (display vs. announcement) differently. */
  kind: LatestMessagePreviewKind;
  latestMessage?: LocalMessage;
  /** Poll question, for the `poll` kind. */
  pollName?: string;
  /** The localized DISPLAY preview as a plain string. */
  text: string;
};

/**
 * Resolves the channel's latest-message preview once: the localized DISPLAY string, a `kind`
 * discriminant, and the bits announcements need (poll question, attachment type). Single source of
 * truth for the display variant ({@link getLatestMessagePreview}) and the announcement variant
 * ({@link getLatestMessagePreviewText}), so the translation lookup and branching run once per call.
 */
const getLatestMessagePreviewParts = (
  channel: Channel,
  t: TranslationContextValue['t'],
  userLanguage: TranslationContextValue['userLanguage'] = 'en',
): LatestMessagePreviewParts => {
  const latestMessage =
    channel.state.latestMessages[channel.state.latestMessages.length - 1];

  const previewTextToRender =
    getTranslatedMessageText({ language: userLanguage, message: latestMessage }) ||
    latestMessage?.text;
  const poll = latestMessage?.poll;

  if (!latestMessage) {
    return {
      isUserMessageText: false,
      kind: 'empty',
      latestMessage,
      text: t('Nothing yet...'),
    };
  }

  if (isMessageDeleted(latestMessage)) {
    return {
      isUserMessageText: false,
      kind: 'deleted',
      latestMessage,
      text: t('Message deleted'),
    };
  }

  if (poll) {
    if (!poll.vote_count) {
      const createdBy =
        poll.created_by?.id === channel.getClient().userID
          ? t('You')
          : (poll.created_by?.name ?? t('Poll'));
      return {
        isUserMessageText: false,
        kind: 'poll',
        latestMessage,
        pollName: poll.name,
        text: t('📊 {{createdBy}} created: {{ pollName}}', {
          createdBy,
          pollName: poll.name,
        }),
      };
    } else {
      const latestVote = getLatestPollVote(
        poll.latest_votes_by_option as Record<string, PollVote[]>,
      );
      const option =
        latestVote && poll.options.find((opt) => opt.id === latestVote.option_id);

      if (option && latestVote) {
        return {
          isUserMessageText: false,
          kind: 'poll',
          latestMessage,
          pollName: poll.name,
          text: t('📊 {{votedBy}} voted: {{pollOptionText}}', {
            pollOptionText: option.text,
            votedBy:
              latestVote?.user?.id === channel.getClient().userID
                ? t('You')
                : (latestVote.user?.name ?? t('Poll')),
          }),
        };
      }
    }
  }

  if (previewTextToRender) {
    return {
      isUserMessageText: true,
      kind: 'text',
      latestMessage,
      text: previewTextToRender,
    };
  }

  if (latestMessage.command) {
    return {
      isUserMessageText: false,
      kind: 'command',
      latestMessage,
      text: `/${latestMessage.command}`,
    };
  }

  if (latestMessage.attachments?.length) {
    return {
      isUserMessageText: false,
      kind: 'attachment',
      latestMessage,
      text: t('🏙 Attachment...'),
    };
  }

  if (latestMessage.shared_location) {
    return {
      isUserMessageText: false,
      kind: 'location',
      latestMessage,
      text: t('📍Shared location'),
    };
  }

  return {
    isUserMessageText: false,
    kind: 'text',
    latestMessage,
    text: t('Empty message...'),
  };
};

/**
 * Maps a known attachment `type` to a localized, human-readable word (e.g. "image" → "Image"). The
 * cases are literal `t('aria/…')` calls so `i18next-cli` extracts them. Unknown/custom types return
 * `undefined`, so the announcement falls back to a generic "Attachment".
 */
const getAttachmentTypeLabel = (
  type: string | undefined,
  t: TranslationContextValue['t'],
): string | undefined => {
  switch (type) {
    case 'audio':
      return t('aria/audio');
    case 'file':
      return t('aria/file');
    case 'giphy':
      return t('aria/GIF');
    case 'image':
      return t('aria/image');
    case 'video':
      return t('aria/video');
    case 'voiceRecording':
      return t('aria/voice message');
    default:
      return undefined;
  }
};

/**
 * The text announced for the channel's latest message (for an accessible name / live region).
 * Non-text content gets a concise, screen-reader-friendly phrasing that may differ from the visible
 * preview: a poll announces its question, an attachment its type, a shared location and a deleted
 * message a plain phrase. User-message text is stripped of markdown so the words are read, not the
 * syntax (AI-generated text is returned verbatim, matching the display path).
 */
export const getLatestMessagePreviewText = (
  channel: Channel,
  t: TranslationContextValue['t'],
  userLanguage: TranslationContextValue['userLanguage'] = 'en',
  isMessageAIGenerated?: ChatContextValue['isMessageAIGenerated'],
): string => {
  const { isUserMessageText, kind, latestMessage, pollName, text } =
    getLatestMessagePreviewParts(channel, t, userLanguage);

  switch (kind) {
    case 'poll':
      return t('aria/Poll: {{ pollName }}', { pollName: pollName ?? '' });
    case 'attachment': {
      // Link previews are announced separately (see the `linkPreview` label part); decide by the
      // count of real attachments. Multiple → a generic phrase (the count is announced alongside);
      // a single one → its localized type.
      const realAttachments =
        latestMessage?.attachments?.filter((attachment) => !attachment.og_scrape_url) ??
        [];
      if (realAttachments.length > 1) return t('aria/Message with attachments');
      const typeLabel = getAttachmentTypeLabel(realAttachments[0]?.type, t);
      return typeLabel
        ? t('aria/Attachment {{ attachmentType }}', { attachmentType: typeLabel })
        : t('aria/Attachment');
    }
    case 'location':
      return t('aria/Shared location');
    case 'empty':
      // The visible preview says "Nothing yet..."; spell it out for assistive tech.
      return t('aria/There are no messages in this chat.');
    case 'text':
      // `latestMessage` guard is redundant at runtime (isUserMessageText implies it) but narrows
      // the optional type for `isMessageAIGenerated`.
      return isUserMessageText && latestMessage && !isMessageAIGenerated?.(latestMessage)
        ? stripMarkdownToText(text)
        : text;
    default:
      // 'deleted' ("Message deleted") and 'command' ("/cmd") read as-is.
      return text;
  }
};

export const getLatestMessagePreview = (
  channel: Channel,
  t: TranslationContextValue['t'],
  userLanguage: TranslationContextValue['userLanguage'] = 'en',
  isMessageAIGenerated?: ChatContextValue['isMessageAIGenerated'],
): ReactNode => {
  const { isUserMessageText, latestMessage, text } = getLatestMessagePreviewParts(
    channel,
    t,
    userLanguage,
  );

  // Only the plain user-message text is rendered as markdown — unless it is AI-generated, which is
  // returned verbatim. Every other branch is a localized phrase used as-is. (`latestMessage` guard
  // is redundant at runtime but narrows the optional type for `isMessageAIGenerated`.)
  return isUserMessageText && latestMessage && !isMessageAIGenerated?.(latestMessage)
    ? renderPreviewText(text)
    : text;
};

export type GroupChannelDisplayInfoMember = {
  imageUrl?: string;
  userName?: string;
};

export type GroupChannelDisplayInfo = {
  members: GroupChannelDisplayInfoMember[];
  /** When members.length > 4, count for the "+N" badge (members.length - 2). */
  overflowCount?: number;
};

/**
 * Channel display image: channel.data.image, or for DM (2 members) the other member's user.image.
 */
export const getChannelDisplayImage = (
  channel: Channel,
  currentUserId?: string,
): string | undefined => {
  const data = channel.data as { image?: string } | undefined;
  if (data?.image && typeof data.image === 'string') return data.image;

  const memberList = Object.values(channel.state.members);
  if (memberList.length === 2) {
    const other = memberList.find((m) => m.user?.id !== currentUserId);
    const image = other?.user?.image;
    if (image && typeof image === 'string') return image;
  }
  return undefined;
};

export const getGroupChannelDisplayInfo = (
  channel: Channel,
): GroupChannelDisplayInfo | undefined => {
  const members = Object.values(channel.state.members);
  if (members.length <= 2) return;

  const memberList: GroupChannelDisplayInfoMember[] = [];
  for (const member of members) {
    const { user } = member;
    if (!user?.name && !user?.image) continue;
    memberList.push({ imageUrl: user.image, userName: user.name });
  }
  return {
    members: memberList,
  };
};
