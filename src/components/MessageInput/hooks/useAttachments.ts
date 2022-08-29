import { useCallback } from 'react';
import { nanoid } from 'nanoid';

import { useImageUploads } from './useImageUploads';
import { useFileUploads } from './useFileUploads';

import { useChannelStateContext } from '../../../context/ChannelStateContext';

import type { FileLike } from 'react-file-utils';

import type { MessageInputProps } from '../MessageInput';
import type { MessageInputReducerAction, MessageInputState } from './useMessageInputState';

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
  const { noFiles } = props;
  const { fileUploads, imageUploads } = state;

  const { maxNumberOfFiles, multipleUploads } = useChannelStateContext<StreamChatGenerics>(
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
    [maxFilesLeft, noFiles],
  );

  return {
    maxFilesLeft,
    numberOfUploads,
    removeFile,
    removeImage,
    uploadFile,
    uploadImage,
    uploadNewFiles,
  };
};
