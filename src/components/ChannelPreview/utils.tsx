import React from 'react';

import Markdown from 'react-markdown';

import type { Channel, PollVote, TranslationLanguages, UserResponse } from 'stream-chat';

import type { TranslationContextValue } from '../../context/TranslationContext';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { ChatContextValue } from '../../context';

export const renderPreviewText = (text: string) => <Markdown skipHtml>{text}</Markdown>;

const getLatestPollVote = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  latestVotesByOption: Record<string, PollVote<StreamChatGenerics>[]>,
) => {
  let latestVote: PollVote<StreamChatGenerics> | undefined;
  for (const optionVotes of Object.values(latestVotesByOption)) {
    optionVotes.forEach((vote) => {
      if (latestVote && new Date(latestVote.updated_at) >= new Date(vote.created_at)) return;
      latestVote = vote;
    });
  }

  return latestVote;
};

export const getLatestMessagePreview = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
  t: TranslationContextValue['t'],
  userLanguage: TranslationContextValue['userLanguage'] = 'en',
  isMessageAIGenerated?: ChatContextValue<StreamChatGenerics>['isMessageAIGenerated'],
): string | JSX.Element => {
  const latestMessage = channel.state.latestMessages[channel.state.latestMessages.length - 1];

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
          ? t<string>('You')
          : poll.created_by?.name ?? t<string>('Poll');
      return t<string>('📊 {{createdBy}} created: {{ pollName}}', {
        createdBy,
        pollName: poll.name,
      });
    } else {
      const latestVote = getLatestPollVote<StreamChatGenerics>(
        poll.latest_votes_by_option as Record<string, PollVote<StreamChatGenerics>[]>,
      );
      const option = latestVote && poll.options.find((opt) => opt.id === latestVote.option_id);

      if (option && latestVote) {
        return t<string>('📊 {{votedBy}} voted: {{pollOptionText}}', {
          pollOptionText: option.text,
          votedBy:
            latestVote?.user?.id === channel.getClient().userID
              ? t<string>('You')
              : latestVote.user?.name ?? t<string>('Poll'),
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

  return t('Empty message...');
};

export type GroupChannelDisplayInfo = { image?: string; name?: string }[];

export const getGroupChannelDisplayInfo = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
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

const getChannelDisplayInfo = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  info: 'name' | 'image',
  channel: Channel<StreamChatGenerics>,
  currentUser?: UserResponse<StreamChatGenerics>,
) => {
  if (channel.data?.[info]) return channel.data[info];
  const members = Object.values(channel.state.members);
  if (members.length !== 2) return;
  const otherMember = members.find((member) => member.user?.id !== currentUser?.id);
  return otherMember?.user?.[info];
};

export const getDisplayTitle = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
  currentUser?: UserResponse<StreamChatGenerics>,
) => getChannelDisplayInfo('name', channel, currentUser);

export const getDisplayImage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
  currentUser?: UserResponse<StreamChatGenerics>,
) => getChannelDisplayInfo('image', channel, currentUser);
