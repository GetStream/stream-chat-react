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
    const renderedText = renderPreviewText(previewTextToRender);
    return renderedText;
  }

  if (latestMessage.command) {
    return `/${latestMessage.command}`;
  }

  if (latestMessage.attachments?.length) {
    return t('🏙 Attachment...');
  }

  return t('Empty message...');
};

export const getDisplayTitle = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  channel: Channel<StreamChatGenerics>,
  currentUser?: UserResponse<StreamChatGenerics>,
) => {
  let title = channel.data?.name;
  const members = Object.values(channel.state.members);

  if (!title && members.length === 2) {
    const otherMember = members.find((member) => member.user?.id !== currentUser?.id);
    if (otherMember?.user?.name) {
      title = otherMember.user.name;
    }
  }

  return title;
};

export const getDisplayImage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  channel: Channel<StreamChatGenerics>,
  currentUser?: UserResponse<StreamChatGenerics>,
) => {
  let image = channel.data?.image;
  const members = Object.values(channel.state.members);

  if (!image && members.length === 2) {
    const otherMember = members.find((member) => member.user?.id !== currentUser?.id);
    if (otherMember?.user?.image) {
      image = otherMember.user.image;
    }
  }

  return image;
};
