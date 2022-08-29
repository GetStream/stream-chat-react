import React, { useCallback, useEffect } from 'react';

import { checkUploadPermissions } from './utils';

import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { SendFileAPIResponse } from 'stream-chat';
import type { MessageInputReducerAction, MessageInputState } from './useMessageInputState';
import type { MessageInputProps } from '../MessageInput';

import type { CustomTrigger, DefaultStreamChatGenerics } from '../../../types/types';

export const useImageUploads = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  props: MessageInputProps<StreamChatGenerics, V>,
  state: MessageInputState<StreamChatGenerics>,
  dispatch: React.Dispatch<MessageInputReducerAction<StreamChatGenerics>>,
) => {
  const { doImageUploadRequest, errorHandler } = props;
  const { imageUploads } = state;

  const { channel } = useChannelStateContext<StreamChatGenerics>('useImageUploads');
  const { getAppSettings } = useChatContext<StreamChatGenerics>('useImageUploads');
  const { addNotification } = useChannelActionContext<StreamChatGenerics>('useImageUploads');
  const { t } = useTranslationContext('useImageUploads');

  const removeImage = useCallback((id: string) => {
    dispatch({ id, type: 'removeImageUpload' });
    // TODO: cancel upload if still uploading
  }, []);

  const uploadImage = useCallback(
    async (id: string) => {
      const img = imageUploads[id];
      if (!img) return;

      const { file } = img;

      if (img.state !== 'uploading') {
        dispatch({ id, state: 'uploading', type: 'setImageUpload' });
      }

      const canUpload = await checkUploadPermissions({
        addNotification,
        file,
        getAppSettings,
        t,
        uploadType: 'image',
      });

      if (!canUpload) return removeImage(id);

      let response: SendFileAPIResponse;

      try {
        if (doImageUploadRequest) {
          response = await doImageUploadRequest(file, channel);
        } else {
          response = await channel.sendImage(file as File);
        }
      } catch (error) {
        const errorMessage: string =
          typeof (error as Error).message === 'string'
            ? (error as Error).message
            : t('Error uploading image');

        addNotification(errorMessage, 'error');

        let alreadyRemoved = false;

        if (!imageUploads[id]) {
          alreadyRemoved = true;
        } else {
          dispatch({ id, state: 'failed', type: 'setImageUpload' });
        }

        if (!alreadyRemoved && errorHandler) {
          // TODO: verify if the parameters passed to the error handler actually make sense
          errorHandler(error as Error, 'upload-image', {
            ...file,
            id,
          });
        }

        return;
      }

      // If doImageUploadRequest returns any falsy value, then don't create the upload preview.
      // This is for the case if someone wants to handle failure on app level.
      if (!response) {
        removeImage(id);
        return;
      }

      if (img.previewUri) URL.revokeObjectURL?.(img.previewUri);

      dispatch({
        id,
        previewUri: undefined,
        state: 'finished',
        type: 'setImageUpload',
        url: response.file,
      });
    },
    [imageUploads, channel, doImageUploadRequest, errorHandler, removeImage],
  );

  useEffect(() => {
    const upload = Object.values(imageUploads).find(
      (imageUpload) => imageUpload.state === 'uploading' && imageUpload.file,
    );
    if (!upload) return;

    uploadImage(upload.id);
  }, [imageUploads, uploadImage]);

  return {
    removeImage,
    uploadImage,
  };
};
