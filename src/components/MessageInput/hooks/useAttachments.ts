import { useCallback } from 'react';
import { nanoid } from 'nanoid';

import { useImageUploads } from './useImageUploads';
import { useFileUploads } from './useFileUploads';
import { checkUploadPermissions } from './utils';
import { isLocalAttachment, isLocalImageAttachment, isUploadedImage } from '../../Attachment';

import {
  useChannelActionContext,
  useChannelStateContext,
  useChatContext,
  useTranslationContext,
} from '../../../context';

import type { Attachment, SendFileAPIResponse } from 'stream-chat';
import type { MessageInputReducerAction, MessageInputState } from './useMessageInputState';
import type { MessageInputProps } from '../MessageInput';
import type {
  AttachmentLoadingState,
  BaseLocalAttachmentMetadata,
  LocalAttachment,
} from '../types';
import type { FileLike } from '../../ReactFileUtilities';
import type { CustomTrigger, DefaultStreamChatGenerics } from '../../../types/types';

const apiMaxNumberOfFiles = 10;

const ensureIsLocalAttachment = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  attachment: Attachment<StreamChatGenerics> | LocalAttachment<StreamChatGenerics>,
): LocalAttachment<StreamChatGenerics> => {
  if (isLocalAttachment(attachment)) {
    return attachment;
  }
  const { localMetadata, ...rest } = attachment;
  return {
    localMetadata: {
      ...(localMetadata ?? {}),
      id: (localMetadata as BaseLocalAttachmentMetadata)?.id || nanoid(),
    },
    ...rest,
  };
};

export const useAttachments = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  props: MessageInputProps<StreamChatGenerics, V>,
  state: MessageInputState<StreamChatGenerics>,
  dispatch: React.Dispatch<MessageInputReducerAction<StreamChatGenerics>>,
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | undefined>,
) => {
  const { doFileUploadRequest, doImageUploadRequest, errorHandler, noFiles } = props;
  const { fileUploads, imageUploads } = state;
  const { getAppSettings } = useChatContext<StreamChatGenerics>('useAttachments');
  const { t } = useTranslationContext('useAttachments');
  const { addNotification } = useChannelActionContext<StreamChatGenerics>('useAttachments');
  const { channel, maxNumberOfFiles, multipleUploads } = useChannelStateContext<StreamChatGenerics>(
    'useAttachments',
  );

  const { removeFile, uploadFile } = useFileUploads<StreamChatGenerics, V>(props, state, dispatch);

  const { removeImage, uploadImage } = useImageUploads<StreamChatGenerics, V>(
    props,
    state,
    dispatch,
  );

  // Number of files that the user can still add. Should never be more than the amount allowed by the API.
  // If multipleUploads is false, we only want to allow a single upload.
  const maxFilesAllowed = !multipleUploads ? 1 : maxNumberOfFiles || apiMaxNumberOfFiles;

  // OG attachments should not be counted towards "numberOfImages"
  const numberOfImages = Object.values(imageUploads).filter(
    ({ og_scrape_url, state }) => state !== 'failed' && !og_scrape_url,
  ).length;
  const numberOfFiles = Object.values(fileUploads).filter(({ state }) => state !== 'failed').length;
  const numberOfUploads = numberOfImages + numberOfFiles;

  const maxFilesLeft = maxFilesAllowed - numberOfUploads;

  const uploadNewFiles = useCallback(
    (files: FileList | File[] | FileLike[]) => {
      Array.from(files)
        .slice(0, maxFilesLeft)
        .forEach((file) => {
          const id = nanoid();

          if (
            file.type.startsWith('image/') &&
            !file.type.endsWith('.photoshop') // photoshop files begin with 'image/'
          ) {
            dispatch({
              file,
              id,
              previewUri: URL.createObjectURL?.(file),
              state: 'uploading',
              type: 'setImageUpload',
            });
          } else if (file instanceof File && !noFiles) {
            dispatch({ file, id, state: 'uploading', type: 'setFileUpload' });
          }
        });

      textareaRef?.current?.focus();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maxFilesLeft, noFiles],
  );

  const removeAttachments = useCallback(
    (ids: string[]) => {
      if (!ids.length) return;
      dispatch({ ids, type: 'removeAttachments' });
    },
    [dispatch],
  );

  const upsertAttachments = useCallback(
    (attachments: (Attachment<StreamChatGenerics> | LocalAttachment<StreamChatGenerics>)[]) => {
      if (!attachments.length) return;
      dispatch({
        attachments: attachments.map(ensureIsLocalAttachment),
        type: 'upsertAttachments',
      });
    },
    [dispatch],
  );

  const uploadAttachment = useCallback(
    async (
      att: LocalAttachment<StreamChatGenerics>,
    ): Promise<LocalAttachment<StreamChatGenerics> | undefined> => {
      const { localMetadata, ...attachment } = att;
      if (!localMetadata?.file) return att;

      const isImage = isUploadedImage(attachment);
      const id = localMetadata?.id ?? nanoid();
      const { file } = localMetadata;

      const canUpload = await checkUploadPermissions({
        addNotification,
        file,
        getAppSettings,
        t,
        uploadType: isImage ? 'image' : 'file',
      });

      if (!canUpload) {
        const notificationText = t('Missing permissions to upload the attachment');
        console.error(new Error(notificationText));
        addNotification(notificationText, 'error');
        return att;
      }

      upsertAttachments([
        {
          ...attachment,
          localMetadata: {
            ...localMetadata,
            id,
            uploadState: 'uploading',
          },
        },
      ]);

      let response: SendFileAPIResponse;
      try {
        const doUploadRequest = isImage ? doImageUploadRequest : doFileUploadRequest;

        if (doUploadRequest) {
          response = await doUploadRequest(file, channel);
        } else {
          response = await channel[isImage ? 'sendImage' : 'sendFile'](file);
        }
      } catch (error) {
        let finalError: Error = { message: t('Error uploading attachment'), name: 'Error' };
        if (typeof (error as Error).message === 'string') {
          finalError = error as Error;
        } else if (typeof error === 'object') {
          finalError = Object.assign(finalError, error);
        }

        console.error(finalError);
        addNotification(finalError.message, 'error');

        const failedAttachment: LocalAttachment<StreamChatGenerics> = {
          ...attachment,
          localMetadata: {
            ...localMetadata,
            uploadState: 'failed' as AttachmentLoadingState,
          },
        };

        upsertAttachments([failedAttachment]);

        if (errorHandler) {
          errorHandler(finalError as Error, 'upload-attachment', file);
        }

        return failedAttachment;
      }

      if (!response) {
        // Copied this from useImageUpload / useFileUpload. Not sure how failure could be handled on app level.

        // If doUploadRequest returns any falsy value, then don't create the upload preview.
        // This is for the case if someone wants to handle failure on app level.
        removeAttachments([id]);
        return;
      }

      const uploadedAttachment: LocalAttachment<StreamChatGenerics> = {
        ...attachment,
        localMetadata: {
          ...localMetadata,
          uploadState: 'finished' as AttachmentLoadingState,
        },
      };

      if (isLocalImageAttachment(uploadedAttachment)) {
        if (uploadedAttachment.localMetadata.previewUri) {
          URL.revokeObjectURL(uploadedAttachment.localMetadata.previewUri);
          delete uploadedAttachment.localMetadata.previewUri;
        }
        uploadedAttachment.image_url = response.file;
      } else {
        uploadedAttachment.asset_url = response.file;
      }
      upsertAttachments([uploadedAttachment]);

      return uploadedAttachment;
    },
    [
      addNotification,
      channel,
      doFileUploadRequest,
      doImageUploadRequest,
      errorHandler,
      getAppSettings,
      removeAttachments,
      t,
      upsertAttachments,
    ],
  );

  return {
    maxFilesLeft,
    numberOfUploads,
    removeAttachments,
    removeFile,
    removeImage,
    uploadAttachment,
    uploadFile,
    uploadImage,
    uploadNewFiles,
    upsertAttachments,
  };
};
