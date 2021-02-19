import type { Channel, UserResponse } from 'stream-chat';

import type { TranslationContextValue } from '../../context/TranslationContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export const getLatestMessagePreview = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
  t: TranslationContextValue['t'],
) => {
  const latestMessage =
    channel.state.messages[channel.state.messages.length - 1];

  if (!latestMessage) {
    return t('Nothing yet...');
  }
  if (latestMessage.deleted_at) {
    return t('Message deleted');
  }
  if (latestMessage.text) {
    return latestMessage.text;
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
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
  currentUser?: UserResponse<Us>,
) => {
  let title = channel.data?.name;
  const members = Object.values(channel.state.members);

  if (!title && members.length === 2) {
    const otherMember = members.find(
      (member) => member.user?.id !== currentUser?.id,
    );
    if (otherMember?.user?.name) {
      title = otherMember.user.name;
    }
  }

  return title;
};

export const getDisplayImage = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
>(
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
  currentUser?: UserResponse<Us>,
) => {
  let image = channel.data?.image;
  const members = Object.values(channel.state.members);

  if (!image && members.length === 2) {
    const otherMember = members.find(
      (member) => member.user?.id !== currentUser?.id,
    );
    if (otherMember?.user?.image) {
      image = otherMember.user.image;
    }
  }

  return image;
};
