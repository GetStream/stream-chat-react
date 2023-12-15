import { Dispatch, MutableRefObject, useCallback, useEffect } from 'react';
import { nanoid } from 'nanoid';

import { useChannelStateContext } from '../../../context/ChannelStateContext';

import type { FileLike } from '../../ReactFileUtilities';

import type { MessageInputProps } from '../MessageInput';
import type { MessageInputReducerAction, MessageInputState } from './useMessageInputState';

import type { CustomTrigger, DefaultStreamChatGenerics } from '../../../types/types';
import { SendFileAPIResponse } from 'stream-chat';
import { checkUploadPermissions } from './utils';
import { useChannelActionContext, useChatContext, useTranslationContext } from '../../../context';
import { isScrapedContent, isUploadedImage } from '../../Attachment';
import {
  FileUpload,
  ImageUpload,
  LinkPreview,
  MessageComposerAttachment,
  MessageComposerFileAttachment,
  MessageComposerImageAttachment,
  MessageComposerUploadAttachment,
  UploadState,
} from '../types';

const apiMaxNumberOfFiles = 10;

export const getAttachmentTypeFromMime = (mime: string) => {
  if (mime.includes('image/')) return 'image';
  if (mime.includes('video/')) return 'video';
  if (mime.includes('audio/')) return 'audio';
  return 'file';
};

const fileIsImage = (file: File | FileLike) =>
  file.type.startsWith('image/') && !file.type.endsWith('.photoshop'); // photoshop files begin with 'image/'

// const extractFileType(file: File | FileLike) => {
//
// }

const isImageFile = (
  file?: MessageComposerImageAttachment['file'] | MessageComposerFileAttachment['file'],
): file is MessageComposerImageAttachment['file'] =>
  Boolean(file?.type && getAttachmentTypeFromMime(file?.type) === 'image');

export const isMessageComposerImageAttachment = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  attachment: MessageComposerAttachment<StreamChatGenerics>,
): attachment is MessageComposerImageAttachment => isUploadedImage(attachment);

export const isMessageComposerFileAttachment = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  attachment: MessageComposerAttachment<StreamChatGenerics>,
): attachment is MessageComposerFileAttachment =>
  !!attachment.type && ['file', 'audio', 'video'].includes(attachment.type);

export const isLinkPreview = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  attachment: MessageComposerAttachment<StreamChatGenerics>,
): attachment is LinkPreview => isScrapedContent(attachment);

export const isUploadAttachment = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  attachment?: MessageComposerAttachment<StreamChatGenerics>,
): attachment is MessageComposerUploadAttachment =>
  !!(attachment as MessageComposerUploadAttachment)?.file;

const useCalculateMaxFilesLeft = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  state: MessageInputState<StreamChatGenerics>,
) => {
  const { attachments } = state;

  const { maxNumberOfFiles, multipleUploads } = useChannelStateContext<StreamChatGenerics>(
    'useCalculateMaxFilesLeft',
  );

  // Number of files that the user can still add. Should never be more than the amount allowed by the API.
  // If multipleUploads is false, we only want to allow a single upload.
  const maxFilesAllowed = !multipleUploads ? 1 : maxNumberOfFiles || apiMaxNumberOfFiles;

  const numberOfUploads = attachments.filter(
    (att) => isUploadAttachment(att) && att?.uploadState !== UploadState.failed,
  ).length;

  return {
    maxFilesLeft: maxFilesAllowed - numberOfUploads,
    numberOfUploads,
  };
};

export const useAttachments = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  props: MessageInputProps<StreamChatGenerics, V>,
  state: MessageInputState<StreamChatGenerics>,
  dispatch: Dispatch<MessageInputReducerAction<StreamChatGenerics>>,
  textareaRef: MutableRefObject<HTMLTextAreaElement | undefined>,
) => {
  const { doFileUploadRequest, doImageUploadRequest, errorHandler, noFiles } = props;
  const { channel } = useChannelStateContext<StreamChatGenerics>('useAttachments');
  const { addNotification } = useChannelActionContext<StreamChatGenerics>('useAttachments');
  const { getAppSettings } = useChatContext<StreamChatGenerics>('useAttachments');
  const { t } = useTranslationContext('useAttachments');
  const { maxFilesLeft, numberOfUploads } = useCalculateMaxFilesLeft(state);

  const removeAttachment = useCallback((id: string) => {
    dispatch({ id, type: 'removeAttachment' });
  }, []);

  const upsertAttachment = useCallback(
    (attachment: MessageComposerAttachment<StreamChatGenerics>) => {
      dispatch({
        attachment,
        type: 'upsertAttachment',
      });
    },
    [],
  );

  const uploadAttachment = useCallback(
    async (
      id: string,
      doUploadRequest: (
        file: FileUpload['file'] | ImageUpload['file'],
      ) => Promise<SendFileAPIResponse>,
    ) => {
      const attachment = state.attachments.find((att) => att.id === id);
      if (!isUploadAttachment(attachment)) return;
      const uploadType = isMessageComposerImageAttachment(attachment) ? 'image' : 'file';
      const { file } = attachment;

      if (attachment.uploadState !== UploadState.uploading) {
        upsertAttachment({ ...attachment, uploadState: UploadState.uploading });
      }

      const canUpload = await checkUploadPermissions({
        addNotification,
        file,
        getAppSettings,
        t,
        uploadType,
      });

      if (!canUpload) return removeAttachment(id);

      let response: SendFileAPIResponse;

      try {
        response = await doUploadRequest(file);
      } catch (error) {
        const errorMessage: string =
          typeof (error as Error).message === 'string'
            ? (error as Error).message
            : t(`Error uploading ${uploadType}`);

        addNotification(errorMessage, 'error');

        const alreadyRemoved = !state.attachments.find((att) => att.id === id);

        if (!alreadyRemoved) {
          upsertAttachment({ ...attachment, uploadState: UploadState.failed });
          // TODO: verify if the parameters passed to the error handler actually make sense
          errorHandler?.(error as Error, `upload-${uploadType}`, {
            ...file,
            id,
          });
        }

        return;
      }

      // If doFileUploadRequest or doImageUploadRequest returns any falsy value, then don't create the upload preview.
      // This is for the case if someone wants to handle failure on app level.
      if (!response) {
        removeAttachment(id);
        return;
      }

      if (isMessageComposerImageAttachment(attachment) && attachment?.previewUri) {
        URL.revokeObjectURL?.(attachment.previewUri);
      }

      let payload = {
        id,
        type: attachment.type, // this line can be removed once (file|image)Order & (file|image)Uploads are removed
        uploadState: UploadState.finished,
      } as MessageComposerAttachment<StreamChatGenerics>;

      if (attachment.type === 'image') {
        payload = {
          ...payload,
          image_url: response.file,
          previewUri: undefined,
        } as MessageComposerImageAttachment;
      } else {
        payload = {
          ...payload,
          asset_url: response.file,
          thumb_url: response.thumb_url,
        } as MessageComposerFileAttachment;
      }
      upsertAttachment(payload);
    },
    [errorHandler, removeAttachment, state.attachments, upsertAttachment],
  );

  const uploadFile = useCallback(
    (id: string) =>
      uploadAttachment(id, (file) => {
        if (isImageFile(file)) {
          throw new Error(t('Error uploading file - uploaded file is an image.'));
        }
        return doFileUploadRequest
          ? doFileUploadRequest(file, channel)
          : channel.sendFile(file as File);
      }),
    [channel, doFileUploadRequest, uploadAttachment],
  );

  const uploadImage = useCallback(
    (id: string) =>
      uploadAttachment(id, (file) => {
        if (!isImageFile(file)) {
          throw new Error(t('Error uploading image - uploaded file is not an image.'));
        }
        return doImageUploadRequest
          ? doImageUploadRequest(file, channel)
          : channel.sendImage(file as File);
      }),
    [channel, doImageUploadRequest, uploadAttachment],
  );

  const uploadNewFiles = useCallback(
    (files: FileList | File[] | FileLike[]) => {
      Array.from(files)
        .slice(0, maxFilesLeft)
        .forEach((file) => {
          const attachment = {
            file,
            id: nanoid(),
            title: (file as File)?.name,
            type: getAttachmentTypeFromMime(file.type || ''),
            uploadState: UploadState.uploading,
          };
          if (fileIsImage(file)) {
            upsertAttachment({
              ...attachment,
              fallback: (file as File)?.name,
              previewUri: URL.createObjectURL?.(file),
            });
          } else if (noFiles) {
            return;
          } else {
            upsertAttachment({
              ...attachment,
              file_size: file.size,
              mime_type: file.type,
            });
          }
        });

      textareaRef?.current?.focus();
    },
    [maxFilesLeft, noFiles, upsertAttachment],
  );

  useEffect(() => {
    state.attachments.forEach((attachment) => {
      if (
        !(
          isUploadAttachment(attachment) &&
          attachment.uploadState === UploadState.uploading &&
          attachment.id
        )
      )
        return;
      return isMessageComposerImageAttachment(attachment)
        ? uploadImage(attachment.id)
        : uploadFile(attachment.id);
    });
  }, [state.attachments, uploadFile, uploadImage]);

  return {
    maxFilesLeft,
    numberOfUploads,
    removeAttachment,
    removeFile: removeAttachment, // deprecate removeFile in v12
    removeImage: removeAttachment, // deprecate removeImage in v12
    uploadFile,
    uploadImage,
    uploadNewFiles,
    upsertAttachment,
  };
};
