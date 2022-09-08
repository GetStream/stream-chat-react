import { useCallback, useEffect } from 'react';

import { checkUploadPermissions } from './utils';

import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { SendFileAPIResponse } from 'stream-chat';
import type { MessageInputReducerAction, MessageInputState } from './useMessageInputState';
import type { MessageInputProps } from '../MessageInput';

import type { CustomTrigger, DefaultStreamChatGenerics } from '../../../types/types';

export const useFileUploads = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  props: MessageInputProps<StreamChatGenerics, V>,
  state: MessageInputState<StreamChatGenerics>,
  dispatch: React.Dispatch<MessageInputReducerAction<StreamChatGenerics>>,
) => {
  const { doFileUploadRequest, errorHandler } = props;
  const { fileUploads } = state;

  const { channel } = useChannelStateContext<StreamChatGenerics>('useFileUploads');
  const { addNotification } = useChannelActionContext<StreamChatGenerics>('useFileUploads');
  const { getAppSettings } = useChatContext<StreamChatGenerics>('useFileUploads');
  const { t } = useTranslationContext('useFileUploads');

  const uploadFile = useCallback((id: string) => {
    dispatch({ id, state: 'uploading', type: 'setFileUpload' });
  }, []);

  const removeFile = useCallback((id: string) => {
    // TODO: cancel upload if still uploading
    dispatch({ id, type: 'removeFileUpload' });
  }, []);

  useEffect(() => {
    (async () => {
      const upload = Object.values(fileUploads).find(
        (fileUpload) => fileUpload.state === 'uploading' && fileUpload.file,
      );

      if (!upload) return;

      const { file, id } = upload;

      const canUpload = await checkUploadPermissions({
        addNotification,
        file,
        getAppSettings,
        t,
        uploadType: 'file',
      });

      if (!canUpload) return removeFile(id);

      let response: SendFileAPIResponse;

      try {
        if (doFileUploadRequest) {
          response = await doFileUploadRequest(file, channel);
        } else {
          response = await channel.sendFile(file as File);
        }
      } catch (error) {
        const errorMessage: string =
          typeof (error as Error).message === 'string'
            ? (error as Error).message
            : t('Error uploading file');

        addNotification(errorMessage, 'error');

        let alreadyRemoved = false;

        if (!fileUploads[id]) {
          alreadyRemoved = true;
        } else {
          dispatch({ id, state: 'failed', type: 'setFileUpload' });
        }

        if (!alreadyRemoved && errorHandler) {
          // TODO: verify if the parameters passed to the error handler actually make sense
          errorHandler(error as Error, 'upload-file', file);
        }

        return;
      }

      // If doImageUploadRequest returns any falsy value, then don't create the upload preview.
      // This is for the case if someone wants to handle failure on app level.
      if (!response) {
        removeFile(id);
        return;
      }

      dispatch({
        id,
        state: 'finished',
        thumb_url: response.thumb_url,
        type: 'setFileUpload',
        url: response.file,
      });
    })();
  }, [fileUploads, channel, doFileUploadRequest, errorHandler, removeFile]);

  return {
    removeFile,
    uploadFile,
  };
};
