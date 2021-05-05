import type { MessageInputReducerAction, MessageInputState } from './useMessageInputState';
import type { MessageInputProps } from '../MessageInput';
import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { Attachment, logChatPromiseExecution, MessageResponse, UpdatedMessage } from 'stream-chat';
import type {
  CustomTrigger,
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../../types/types';

/**
 * Get attachment type from MIME type
 */
const getAttachmentTypeFromMime = (mime: string) => {
  if (mime.includes('video/')) return 'media';
  if (mime.includes('audio/')) return 'audio';
  return 'file';
};

export const useSubmitHandler = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
>(
  props: MessageInputProps<At, Ch, Co, Ev, Me, Re, Us, V>,
  state: MessageInputState<At, Us>,
  dispatch: React.Dispatch<MessageInputReducerAction<Us>>,
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
  const { channel } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { editMessage, sendMessage } = useChannelActionContext<At, Ch, Co, Ev, Me, Re, Us>();

  const getAttachmentsFromUploads = () => {
    const imageAttachments = imageOrder
      .map((id) => imageUploads[id])
      .filter((upload) => upload.state !== 'failed')
      .filter((
        { id, url },
        _,
        self, // filter out duplicates based on url
      ) => self.every((upload) => upload.id === id || upload.url !== url))
      .map(
        (upload) =>
          ({
            fallback: upload.file.name,
            image_url: upload.url,
            type: 'image',
          } as Attachment<At>),
      );

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
          } as Attachment<At>),
      );

    return [
      ...attachments, // from state
      ...imageAttachments,
      ...fileAttachments,
    ];
  };

  const handleSubmit = (event: React.BaseSyntheticEvent) => {
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
    if (isEmptyMessage && numberOfUploads === 0) {
      return;
    }
    // the channel component handles the actual sending of the message
    const someAttachmentsUploading =
      Object.values(imageUploads).some((upload) => upload.state === 'uploading') ||
      Object.values(fileUploads).some((upload) => upload.state === 'uploading');
    if (someAttachmentsUploading) {
      // TODO: show error to user that they should wait until image is uploaded
      return;
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

    if (!!message && editMessage) {
      // TODO: Remove this line and show an error when submit fails
      if (clearEditingState) {
        clearEditingState();
      }

      const updateMessagePromise = editMessage(({
        ...updatedMessage,
        id: message.id,
      } as unknown) as UpdatedMessage<At, Ch, Co, Me, Re, Us>).then(clearEditingState);

      logChatPromiseExecution(updateMessagePromise, 'update message');
      dispatch({ type: 'clear' });
    } else if (overrideSubmitHandler && channel) {
      overrideSubmitHandler(
        {
          ...updatedMessage,
          parent,
        },
        channel.cid,
      );
      dispatch({ type: 'clear' });
    } else if (sendMessage) {
      const sendMessagePromise = sendMessage({
        ...updatedMessage,
        parent: parent as MessageResponse<At, Ch, Co, Me, Re, Us>,
      });
      logChatPromiseExecution(sendMessagePromise, 'send message');
      dispatch({ type: 'clear' });
    }
    if (channel && publishTypingEvent) logChatPromiseExecution(channel.stopTyping(), 'stop typing');
  };

  return {
    handleSubmit,
  };
};
