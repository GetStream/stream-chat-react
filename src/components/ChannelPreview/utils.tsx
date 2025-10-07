import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { ReactNode } from 'react';
import type { Channel, PollVote, TranslationLanguages, UserResponse } from 'stream-chat';

import type { TranslationContextValue } from '../../context/TranslationContext';
import type { ChatContextValue } from '../../context';
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
    latestMessage?.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] ||
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

export type GroupChannelDisplayInfo = { image?: string; name?: string }[];

export const getGroupChannelDisplayInfo = (
  channel: Channel,
): GroupChannelDisplayInfo | undefined => {
  const members = Object.values(channel.state.members);
  if (members.length <= 2) return;

  const info: GroupChannelDisplayInfo = [];
  for (let i = 0; i < members.length; i++) {
    const { user } = members[i];
    if (!user?.name && !user?.image) continue;
    info.push({ image: user.image, name: user.name });
    if (info.length === 4) break;
  }
  return info;
};

const getChannelDisplayInfo = (
  info: 'name' | 'image',
  channel: Channel,
  currentUser?: UserResponse,
) => {
  if (channel.data?.[info]) return channel.data[info];
  const members = Object.values(channel.state.members);
  if (members.length !== 2) return;
  const otherMember = members.find((member) => member.user?.id !== currentUser?.id);
  return otherMember?.user?.[info];
};

export const getDisplayTitle = (channel: Channel, currentUser?: UserResponse) =>
  getChannelDisplayInfo('name', channel, currentUser);

export const getDisplayImage = (channel: Channel, currentUser?: UserResponse) =>
  getChannelDisplayInfo('image', channel, currentUser);
