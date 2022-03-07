import { Message, useChannelStateContext } from 'stream-chat-react';

import { SocialMessage } from '../Message/SocialMessageUI';

import { Chats, Files, Photos } from '../../assets';

import { useViewContext } from '../../contexts/ViewContext';

import { StreamChatGenerics } from '../../types';

import './ChatInfoItem.scss';

export const ChatInfoItem = () => {
  const { channel } = useChannelStateContext<StreamChatGenerics>();

  const { chatInfoItem } = useViewContext();

  const getPageData = (info: string | undefined) => {
    let iterator;

    switch (info) {
      case 'Pinned Messages':
        iterator = channel.state.pinnedMessages;
        break;
      case 'Photos & Videos':
        iterator = channel.state.messages
          .map((message) => {
            return {
              ...message,
              attachments: message?.attachments?.filter(
                (subElement) => subElement.type === 'image',
              ),
            };
          })
          .filter(({ attachments }) => attachments?.length);
        break;
      case 'Files':
        iterator = channel.state.messages
          .map((message) => {
            return {
              ...message,
              attachments: message?.attachments?.filter((subElement) => subElement.type === 'file'),
            };
          })
          .filter(({ attachments }) => attachments?.length);
        break;
      // case 'Shared Groups':
      //   iterator
      //   break;
      default:
        break;
    }

    return iterator;
  };

  const data = getPageData(chatInfoItem);

  const getEmptyState = () => {
    let description;
    let Icon;
    let title;

    switch (chatInfoItem) {
      case 'Pinned Messages':
        description = 'Long-press an important message and choose Pin to conversation.';
        Icon = Chats;
        title = 'No pinned messages';
        break;
      case 'Photos & Videos':
        description = 'Photos or video sent in this chat will appear here.';
        Icon = Photos;
        title = 'No media';
        break;
      case 'Files':
        description = 'Files sent in this chat will appear here.';
        Icon = Files;
        title = 'No files';
        break;
      case 'Shared Groups':
        description = 'Group shared with User will appear here.';
        Icon = Chats;
        title = 'No shared groups';
        break;
      default:
        break;
    }

    return { description, Icon, title };
  };

  if (!data?.length) {
    const { description, Icon, title } = getEmptyState();

    return (
      <div className='chat-info-item'>
        <div className='chat-info-item-empty'>
          {Icon ? <Icon /> : null}
          <span className='chat-info-item-empty-title'>{title}</span>
          <span className='chat-info-item-empty-description'>{description}</span>
        </div>
      </div>
    );
  }

  return (
    <div className='chat-info-item'>
      {data?.map((message, i) => (
        <div key={`${i}-${message.id}`} className='chat-info-item-wrapper'>
          <Message Message={SocialMessage} key={`${i}-${message.id}`} message={message} />
        </div>
      ))}
    </div>
  );
};
