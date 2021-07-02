import React from 'react';

import ReactMarkdown from 'react-markdown/with-html';

import type { Channel, TranslationLanguages, UserResponse } from 'stream-chat';

import type { TranslationContextValue } from '../../context/TranslationContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export const renderPreviewText = (text: string) => <ReactMarkdown source={text} />;

export const getLatestMessagePreview = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
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
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
  currentUser?: UserResponse<Us>,
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
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
>(
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
  currentUser?: UserResponse<Us>,
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
