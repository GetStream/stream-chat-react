import React from 'react';

import ReactMarkdown from 'react-markdown';

import type { Channel, TranslationLanguages, UserResponse } from 'stream-chat';

import type { TranslationContextValue } from '../../context/TranslationContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

export const renderPreviewText = (text: string) => <ReactMarkdown skipHtml>{text}</ReactMarkdown>;

export const getLatestMessagePreview = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  channel: Channel<StreamChatGenerics>,
  t: TranslationContextValue['t'],
  userLanguage: TranslationContextValue['userLanguage'] = 'en',
): string | JSX.Element => {
  const latestMessage = channel.state.messages[channel.state.messages.length - 1];

  const previewTextToRender =
    latestMessage?.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] ||
    latestMessage?.text;

  if (!latestMessage) {
    return t('Nothing yet...');
  }

  if (latestMessage.deleted_at) {
    return t('Message deleted');
  }

  if (previewTextToRender) {
    return renderPreviewText(previewTextToRender);
  }

  if (latestMessage.command) {
    return `/${latestMessage.command}`;
  }

  if (latestMessage.attachments?.length) {
    return t('🏙 Attachment...');
  }

  return t('Empty message...');
};

const getChannelDisplayInfo = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
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
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  channel: Channel<StreamChatGenerics>,
  currentUser?: UserResponse<StreamChatGenerics>,
) => getChannelDisplayInfo('name', channel, currentUser);

export const getDisplayImage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  channel: Channel<StreamChatGenerics>,
  currentUser?: UserResponse<StreamChatGenerics>,
) => getChannelDisplayInfo('image', channel, currentUser);
