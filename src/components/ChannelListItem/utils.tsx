import type { ReactNode } from 'react';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Channel, LocalMessage, PollVoteResponseData } from 'stream-chat';
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
import {
  deriveChannelDisplayImage,
  deriveGroupChannelDisplayInfo,
} from './channelDisplayState';

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

// Strips markdown for screen-reader announcements with the same remark plugins as the visible
// preview. The processor is built lazily so importing this file does not evaluate `remarkPlugins`
// (test files that mock the plugin modules would fail at import). Returns the raw text when
// processing throws or yields nothing.
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

const getLatestPollVote = (
  latestVotesByOption: Record<string, PollVoteResponseData[]>,
) => {
  let latestVote: PollVoteResponseData | undefined;
  for (const optionVotes of Object.values(latestVotesByOption)) {
    optionVotes.forEach((vote) => {
      if (latestVote && latestVote.updated_at >= vote.created_at) return;
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
  /** True only for plain user message text, which the display variant renders as markdown. */
  isUserMessageText: boolean;
  /** What the latest message is, so the display and the announcement can phrase it differently. */
  kind: LatestMessagePreviewKind;
  latestMessage?: LocalMessage;
  /** Poll question, for the `poll` kind. */
  pollName?: string;
  /** The localized display preview as a plain string. */
  text: string;
};

/**
 * Resolves the latest-message preview shared by {@link getLatestMessagePreview} and
 * {@link getLatestMessagePreviewText}: the display string, a `kind`, and the poll question.
 */
const getLatestMessagePreviewParts = (
  channel: Channel,
  t: TranslationContextValue['t'],
  userLanguage: TranslationContextValue['userLanguage'] = 'en',
  latestMessageArg?: LocalMessage,
): LatestMessagePreviewParts => {
  // A supplied message keeps the preview consistent with the other parts derived from it.
  const latestMessage =
    latestMessageArg ??
    channel.messagePaginator.aggregateState.getLatestValue().lastMessage ??
    undefined;

  const previewTextToRender =
    getTranslatedMessageText({ language: userLanguage, message: latestMessage }) ||
    latestMessage?.text;
  const poll = latestMessage?.poll;

  if (!latestMessage) {
    return {
      isUserMessageText: false,
      kind: 'empty',
      latestMessage,
      text: t('common.nothingYet.text', 'Nothing yet...'),
    };
  }

  if (isMessageDeleted(latestMessage)) {
    return {
      isUserMessageText: false,
      kind: 'deleted',
      latestMessage,
      text: t('common.messageDeleted.text', 'Message deleted'),
    };
  }

  if (poll) {
    if (!poll.vote_count) {
      const createdBy =
        poll.created_by?.id === channel.getClient().userID
          ? t('common.you.label', 'You')
          : (poll.created_by?.name ?? t('common.poll.label', 'Poll'));
      return {
        isUserMessageText: false,
        kind: 'poll',
        latestMessage,
        pollName: poll.name,
        text: t(
          'channelListItem.created.text',
          '📊 {{createdBy}} created: {{ pollName}}',
          {
            createdBy,
            pollName: poll.name,
          },
        ),
      };
    } else {
      const latestVote = getLatestPollVote(
        poll.latest_votes_by_option as Record<string, PollVoteResponseData[]>,
      );
      const option =
        latestVote && poll.options.find((opt) => opt.id === latestVote.option_id);

      if (option && latestVote) {
        return {
          isUserMessageText: false,
          kind: 'poll',
          latestMessage,
          pollName: poll.name,
          text: t(
            'channelListItem.voted.text',
            '📊 {{votedBy}} voted: {{pollOptionText}}',
            {
              pollOptionText: option.text,
              votedBy:
                latestVote?.user?.id === channel.getClient().userID
                  ? t('common.you.label', 'You')
                  : (latestVote.user?.name ?? t('common.poll.label', 'Poll')),
            },
          ),
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
      text: t('channelListItem.attachment.text', '🏙 Attachment...'),
    };
  }

  if (latestMessage.shared_location) {
    return {
      isUserMessageText: false,
      kind: 'location',
      latestMessage,
      text: t('channelListItem.sharedLocation.text', '📍Shared location'),
    };
  }

  return {
    isUserMessageText: false,
    kind: 'text',
    latestMessage,
    text: t('common.emptyMessage.text', 'Empty message...'),
  };
};

/**
 * Maps a known attachment `type` to a localized word. Unknown or custom types return `undefined`.
 * The cases are literal `t()` calls so the translation key generator finds them.
 */
const getAttachmentTypeLabel = (
  type: string | undefined,
  t: TranslationContextValue['t'],
): string | undefined => {
  switch (type) {
    case 'audio':
      return t('channelListItem.audio.ariaLabel', 'audio');
    case 'file':
      return t('channelListItem.file.ariaLabel', 'file');
    case 'giphy':
      return t('channelListItem.gif.ariaLabel', 'GIF');
    case 'image':
      return t('channelListItem.image.ariaLabel', 'image');
    case 'video':
      return t('channelListItem.video.ariaLabel', 'video');
    case 'voiceRecording':
      return t('channelListItem.voiceMessage.ariaLabel', 'voice message');
    default:
      return undefined;
  }
};

/**
 * The text announced for the channel's latest message. Non-text content gets a phrase that may
 * differ from the visible preview: a poll announces its question and an attachment its type.
 * User message text is stripped of markdown, except AI-generated text, which is returned verbatim.
 *
 * @param channel - Channel whose latest message is announced.
 * @param t - Translation function.
 * @param userLanguage - Language of the translated message text. Defaults to 'en'.
 * @param isMessageAIGenerated - Tells whether a message is AI-generated.
 * @param latestMessage - Message to announce. Defaults to the channel's last message.
 * @returns The announcement text.
 */
export const getLatestMessagePreviewText = (
  channel: Channel,
  t: TranslationContextValue['t'],
  userLanguage: TranslationContextValue['userLanguage'] = 'en',
  isMessageAIGenerated?: ChatContextValue['isMessageAIGenerated'],
  latestMessage?: LocalMessage,
): string => {
  const {
    isUserMessageText,
    kind,
    latestMessage: resolvedLatestMessage,
    pollName,
    text,
  } = getLatestMessagePreviewParts(channel, t, userLanguage, latestMessage);

  switch (kind) {
    case 'poll':
      return t('channelListItem.poll.ariaLabel', 'Poll: {{ pollName }}', {
        pollName: pollName ?? '',
      });
    case 'attachment': {
      // Link previews are announced by the `linkPreview` label part, so only other attachments
      // count. Several get a generic phrase (the label announces the count), one gets its type.
      const realAttachments =
        resolvedLatestMessage?.attachments?.filter(
          (attachment) => !attachment.og_scrape_url,
        ) ?? [];
      if (realAttachments.length > 1)
        return t(
          'channelListItem.messageAttachments.ariaLabel',
          'Message with attachments',
        );
      const typeLabel = getAttachmentTypeLabel(realAttachments[0]?.type, t);
      return typeLabel
        ? t(
            'channelListItem.attachment.withAttachmentType.ariaLabel',
            'Attachment {{ attachmentType }}',
            { attachmentType: typeLabel },
          )
        : t('channelListItem.attachment.ariaLabel', 'Attachment');
    }
    case 'location':
      return t('channelListItem.sharedLocation.ariaLabel', 'Shared location');
    case 'empty':
      // The visible text is "Nothing yet..."; the announcement spells it out.
      return t(
        'channelListItem.noMessagesChat.ariaLabel',
        'There are no messages in this chat.',
      );
    case 'text':
      // The `resolvedLatestMessage` check is redundant at runtime but narrows the type.
      return isUserMessageText &&
        resolvedLatestMessage &&
        !isMessageAIGenerated?.(resolvedLatestMessage)
        ? stripMarkdownToText(text)
        : text;
    default:
      // 'deleted' and 'command' read as their display text.
      return text;
  }
};

export const getLatestMessagePreview = (
  channel: Channel,
  t: TranslationContextValue['t'],
  userLanguage: TranslationContextValue['userLanguage'] = 'en',
  isMessageAIGenerated?: ChatContextValue['isMessageAIGenerated'],
  latestMessage?: LocalMessage,
): ReactNode => {
  const {
    isUserMessageText,
    latestMessage: resolvedLatestMessage,
    text,
  } = getLatestMessagePreviewParts(channel, t, userLanguage, latestMessage);

  // Only plain user message text is rendered as markdown, and AI-generated text is not. The
  // `resolvedLatestMessage` check is redundant at runtime but narrows the type.
  return isUserMessageText &&
    resolvedLatestMessage &&
    !isMessageAIGenerated?.(resolvedLatestMessage)
    ? renderPreviewText(text)
    : text;
};

export type GroupChannelDisplayInfoMember = {
  imageUrl?: string;
  userName?: string;
};

export type GroupChannelDisplayInfo = {
  members: GroupChannelDisplayInfoMember[];
  /** Not set or read by the SDK; the group avatar derives its "+N" count from `members`. */
  overflowCount?: number;
};

/** `channel.data.custom.image`, or for a DM (2 members) the other member's `user.image`. */
export const getChannelDisplayImage = (
  channel: Channel,
  currentUserId?: string,
): string | undefined =>
  deriveChannelDisplayImage(
    { data: channel.data, members: channel.state.members },
    currentUserId,
  );

export const getGroupChannelDisplayInfo = (
  channel: Channel,
): GroupChannelDisplayInfo | undefined =>
  deriveGroupChannelDisplayInfo({ data: channel.data, members: channel.state.members });
