import type { ReactNode } from 'react';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Channel, PollVote } from 'stream-chat';

import type { ChatContextValue } from '../../context';
import { getTranslatedMessageText } from '../../context/MessageTranslationViewContext';
import type { TranslationContextValue } from '../../context/TranslationContext';
import type { PluggableList } from 'unified';
import { htmlToTextPlugin, imageToLink, plusPlusToEmphasis } from '../Message';
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

export const getLatestMessagePreview = (
  channel: Channel,
  t: TranslationContextValue['t'],
  userLanguage: TranslationContextValue['userLanguage'] = 'en',
  isMessageAIGenerated?: ChatContextValue['isMessageAIGenerated'],
): ReactNode => {
  const latestMessage =
    channel.state.latestMessages[channel.state.latestMessages.length - 1];

  const previewTextToRender =
    getTranslatedMessageText({ language: userLanguage, message: latestMessage }) ||
    latestMessage?.text;
  const poll = latestMessage?.poll;

  if (!latestMessage) {
    return t('Nothing yet...');
  }

  if (latestMessage.deleted_at) {
    return t('Message deleted');
  }

  if (poll) {
    if (!poll.vote_count) {
      const createdBy =
        poll.created_by?.id === channel.getClient().userID
          ? t('You')
          : (poll.created_by?.name ?? t('Poll'));
      return t('📊 {{createdBy}} created: {{ pollName}}', {
        createdBy,
        pollName: poll.name,
      });
    } else {
      const latestVote = getLatestPollVote(
        poll.latest_votes_by_option as Record<string, PollVote[]>,
      );
      const option =
        latestVote && poll.options.find((opt) => opt.id === latestVote.option_id);

      if (option && latestVote) {
        return t('📊 {{votedBy}} voted: {{pollOptionText}}', {
          pollOptionText: option.text,
          votedBy:
            latestVote?.user?.id === channel.getClient().userID
              ? t('You')
              : (latestVote.user?.name ?? t('Poll')),
        });
      }
    }
  }

  if (previewTextToRender) {
    return isMessageAIGenerated?.(latestMessage)
      ? previewTextToRender
      : renderPreviewText(previewTextToRender);
  }

  if (latestMessage.command) {
    return `/${latestMessage.command}`;
  }

  if (latestMessage.attachments?.length) {
    return t('🏙 Attachment...');
  }

  if (latestMessage.shared_location) {
    return t('📍Shared location');
  }

  return t('Empty message...');
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
export const getChannelDisplayImage = (channel: Channel): string | undefined => {
  const data = channel.data as { image?: string } | undefined;
  if (data?.image && typeof data.image === 'string') return data.image;

  const memberList = Object.values(channel.state.members);
  const currentUserId = channel.getClient().userID ?? undefined;
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
    overflowCount: memberList.length > 4 ? memberList.length - 2 : undefined,
  };
};
