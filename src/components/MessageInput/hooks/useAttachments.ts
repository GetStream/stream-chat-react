import { useCallback } from 'react';
import { nanoid } from 'nanoid';

import { useImageUploads } from './useImageUploads';
import { useFileUploads } from './useFileUploads';
import { checkUploadPermissions } from './utils';

import {
  useChannelActionContext,
  useChannelStateContext,
  useChatContext,
  useTranslationContext,
} from '../../../context';

import type { SendFileAPIResponse } from 'stream-chat';
import type { MessageInputReducerAction, MessageInputState } from './useMessageInputState';
import type { MessageInputProps } from '../MessageInput';
import type { LocalAttachment } from '../types';
import type { FileLike } from '../../ReactFileUtilities';
import type { CustomTrigger, DefaultStreamChatGenerics } from '../../../types/types';

const apiMaxNumberOfFiles = 10;

export const useAttachments = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  props: MessageInputProps<StreamChatGenerics, V>,
  state: MessageInputState<StreamChatGenerics>,
  dispatch: React.Dispatch<MessageInputReducerAction<StreamChatGenerics>>,
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | undefined>,
) => {
  const { doFileUploadRequest, errorHandler, noFiles } = props;
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

  const removeAttachment = (id: string) => {
    dispatch({ id, type: 'removeAttachment' });
  };

  const uploadAttachment = useCallback(
    async (
      att: LocalAttachment<StreamChatGenerics>,
    ): Promise<LocalAttachment<StreamChatGenerics>> => {
      const { $internal, ...attachment } = att;
      if (!$internal?.file) return att;

      const id = $internal?.id ?? nanoid();
      const { file } = $internal;
      const canUpload = await checkUploadPermissions({
        addNotification,
        file,
        getAppSettings,
        t,
        uploadType: 'file',
      });

      if (!canUpload) {
        const notificationText = t('Missing permissions to upload the attachment');
        console.error(new Error(notificationText));
        addNotification(notificationText, 'error');
        return att;
      }

      dispatch({
        attachment: {
          ...attachment,
          $internal: {
            ...$internal,
            id,
            uploadState: 'uploading',
          },
        },
        type: 'upsertAttachment',
      });

      try {
        let response: SendFileAPIResponse;
        if (doFileUploadRequest) {
          response = await doFileUploadRequest(file, channel);
        } else {
          response = await channel.sendFile(file as File);
        }
        const uploadedAttachment = {
          ...attachment,
          $internal: {
            ...$internal,
            uploadState: 'finished',
          },
          asset_url: response.file,
        } as LocalAttachment<StreamChatGenerics>;

        dispatch({
          attachment: uploadedAttachment,
          type: 'upsertAttachment',
        });

        return uploadedAttachment;
      } catch (error) {
        let finalError: Error = { message: t('Error uploading attachment'), name: 'Error' };
        if (typeof (error as Error).message === 'string') {
          finalError = error as Error;
        } else if (typeof error === 'object') {
          finalError = Object.assign(finalError, error);
        }

        console.error(finalError);
        addNotification(finalError.message, 'error');

        const failedAttachment = {
          ...attachment,
          $internal: {
            ...$internal,
            uploadState: 'failed',
          },
        } as LocalAttachment<StreamChatGenerics>;

        dispatch({
          attachment: failedAttachment,
          type: 'upsertAttachment',
        });

        if (errorHandler) {
          errorHandler(finalError as Error, 'upload-attachment', file);
        }

        return failedAttachment;
      }
    },
    [addNotification, channel, doFileUploadRequest, dispatch, errorHandler, getAppSettings, t],
  );

  return {
    maxFilesLeft,
    numberOfUploads,
    removeAttachment,
    removeFile,
    removeImage,
    uploadAttachment,
    uploadFile,
    uploadImage,
    uploadNewFiles,
  };
};
