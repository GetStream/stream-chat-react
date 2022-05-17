import { useMemo } from 'react';
import * as linkify from 'linkifyjs';
import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { Attachment, Message, UpdatedMessage } from 'stream-chat';

import type { MessageInputReducerAction, MessageInputState } from './useMessageInputState';
import type { MessageInputProps } from '../MessageInput';

import type { CustomTrigger, DefaultStreamChatGenerics } from '../../../types/types';

const getAttachmentTypeFromMime = (mime: string) => {
  if (mime.includes('video/')) return 'video';
  if (mime.includes('audio/')) return 'audio';
  return 'file';
};

const urnRegularExpression = /(https?:\/\/)?(www\.)?/gi;

export const useSubmitHandler = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  props: MessageInputProps<StreamChatGenerics, V>,
  state: MessageInputState<StreamChatGenerics>,
  dispatch: React.Dispatch<MessageInputReducerAction<StreamChatGenerics>>,
  numberOfUploads: number,
) => {
  const { clearEditingState, message, overrideSubmitHandler, parent, publishTypingEvent } = props;

  const {
    attachments,
    fileOrder,
    fileUploads,
    imageOrder,
    imageUploads,
    mentioned_users,
    text,
  } = state;

  const { channel } = useChannelStateContext<StreamChatGenerics>('useSubmitHandler');
  const { addNotification, editMessage, sendMessage } = useChannelActionContext<StreamChatGenerics>(
    'useSubmitHandler',
  );
  const { t } = useTranslationContext('useSubmitHandler');

  const urnList = useMemo(
    () => linkify.find(text).map(({ value }) => value.replace(urnRegularExpression, '')),
    [text],
  );

  const getAttachmentsFromUploads = () => {
    const imageAttachments = imageOrder
      .map((id) => imageUploads[id])
      .filter((upload) => upload.state !== 'failed')
      .filter((
        { id, url },
        _,
        self, // filter out duplicates based on id or url
      ) => self.every((upload) => upload.id === id || upload.url !== url))
      // .filter((upload) => !upload.og_scrape_url) // filter out OG scraped attachments
      .filter(({ og_scrape_url: url }) => {
        if (!url) return true;
        const urn = url.replace(urnRegularExpression, '');
        return urnList.includes(urn);
      })
      .map<Attachment<StreamChatGenerics>>(({ file: { name }, url, ...rest }) => ({
        fallback: name,
        image_url: url,
        type: 'image',
        // eslint-disable-next-line sort-keys
        author_name: rest.author_name,
        og_scrape_url: rest.og_scrape_url,
        text: rest.text,
        title: rest.title,
        title_link: rest.title_link,
      }));

    const fileAttachments = fileOrder
      .map((id) => fileUploads[id])
      .filter((upload) => upload.state !== 'failed')
      .map(
        (upload) =>
          ({
            asset_url: upload.url,
            file_size: upload.file.size,
            mime_type: upload.file.type,
            title: upload.file.name,
            type: getAttachmentTypeFromMime(upload.file.type || ''),
          } as Attachment<StreamChatGenerics>),
      );

    return [
      ...attachments, // from state
      ...imageAttachments,
      ...fileAttachments,
    ];
  };

  const handleSubmit = async (
    event: React.BaseSyntheticEvent,
    customMessageData?: Partial<Message<StreamChatGenerics>>,
  ) => {
    event.preventDefault();

    const trimmedMessage = text.trim();
    const isEmptyMessage =
      trimmedMessage === '' ||
      trimmedMessage === '>' ||
      trimmedMessage === '``````' ||
      trimmedMessage === '``' ||
      trimmedMessage === '**' ||
      trimmedMessage === '____' ||
      trimmedMessage === '__' ||
      trimmedMessage === '****';

    if (isEmptyMessage && numberOfUploads === 0) return;

    // the channel component handles the actual sending of the message
    const someAttachmentsUploading =
      Object.values(imageUploads).some((upload) => upload.state === 'uploading') ||
      Object.values(fileUploads).some((upload) => upload.state === 'uploading');

    if (someAttachmentsUploading) {
      return addNotification(t('Wait until all attachments have uploaded'), 'error');
    }

    const newAttachments = getAttachmentsFromUploads();

    // Instead of checking if a user is still mentioned every time the text changes,
    // just filter out non-mentioned users before submit, which is cheaper
    // and allows users to easily undo any accidental deletion
    const actualMentionedUsers = Array.from(
      new Set(
        mentioned_users.filter(
          ({ id, name }) => text.includes(`@${id}`) || text.includes(`@${name}`),
        ),
      ),
    );

    const updatedMessage = {
      attachments: newAttachments,
      mentioned_users: actualMentionedUsers,
      text,
    };

    if (message) {
      delete message.i18n;

      try {
        await editMessage(({
          ...message,
          ...updatedMessage,
        } as unknown) as UpdatedMessage<StreamChatGenerics>);

        if (clearEditingState) clearEditingState();
        dispatch({ type: 'clear' });
      } catch (err) {
        addNotification(t('Edit message request failed'), 'error');
      }
    } else {
      try {
        dispatch({ type: 'clear' });

        if (overrideSubmitHandler) {
          await overrideSubmitHandler(
            {
              ...updatedMessage,
              parent,
            },
            channel.cid,
            customMessageData,
          );
        } else {
          await sendMessage(
            {
              ...updatedMessage,
              parent,
            },
            customMessageData,
          );
        }

        if (publishTypingEvent) await channel.stopTyping();
      } catch (err) {
        dispatch({
          getNewText: () => text,
          type: 'setText',
        });

        if (actualMentionedUsers.length) {
          actualMentionedUsers.forEach((user) => {
            dispatch({ type: 'addMentionedUser', user });
          });
        }

        addNotification(t('Send message request failed'), 'error');
      }
    }
  };

  return { handleSubmit };
};
