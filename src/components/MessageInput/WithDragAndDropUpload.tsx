import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';
import type { CSSProperties, ElementType, PropsWithChildren } from 'react';
import type { MessageComposerConfig } from 'stream-chat';

import {
  useChannelStateContext,
  useMessageInputContext,
  useTranslationContext,
} from '../../context';
import { useAttachmentManagerState, useMessageComposer } from './hooks';
import { useStateStore } from '../../store';

const DragAndDropUploadContext = React.createContext<{
  fileQueue: File[];
  addFilesToQueue: ((files: File[]) => void) | null;
  removeFilesFromQueue: ((files: File[]) => void) | null;
}>({
  addFilesToQueue: null,
  fileQueue: [],
  removeFilesFromQueue: null,
});

export const useDragAndDropUploadContext = () => useContext(DragAndDropUploadContext);

/**
 * @private To maintain top -> bottom data flow, the drag-and-drop functionality allows dragging any files to the queue - the closest
 * `MessageInputProvider` will be notified through `DragAndDropUploadContext.fileQueue` and starts the upload with `uploadNewAttachments`,
 * forwarded files are removed from the queue immediately after.
 */
export const useHandleDragAndDropQueuedFiles = () => {
  const { fileQueue, removeFilesFromQueue } = useDragAndDropUploadContext();

  const messageComposer = useMessageComposer();

  useEffect(() => {
    if (!removeFilesFromQueue) return;

    messageComposer.attachmentManager.uploadFiles(fileQueue);

    removeFilesFromQueue(fileQueue);
  }, [fileQueue, removeFilesFromQueue, messageComposer]);
};

const attachmentManagerConfigStateSelector = (state: MessageComposerConfig) => ({
  multipleUploads: state.attachments.maxNumberOfFilesPerMessage > 1,
});

/**
 * Wrapper to replace now deprecated `Channel.dragAndDropWindow` option.
 *
 * @example
 * ```tsx
 * <Channel>
 *  <WithDragAndDropUpload component="section" className="message-list-dnd-wrapper">
 *    <Window>
 *      <MessageList />
 *      <MessageInput />
 *    </Window>
 *  </WithDragAndDropUpload>
 *  <Thread />
 * <Channel>
 * ```
 */
export const WithDragAndDropUpload = ({
  children,
  className,
  component: Component = 'div',
  style,
}: PropsWithChildren<{
  /**
   * @description An element to render as a wrapper onto which drag & drop functionality will be applied.
   * @default 'div'
   */
  component?: ElementType;
  className?: string;
  style?: CSSProperties;
}>) => {
  const [files, setFiles] = useState<File[]>([]);
  const { acceptedFiles = [] } = useChannelStateContext();
  const { t } = useTranslationContext();

  const messageInputContext = useMessageInputContext();
  const dragAndDropUploadContext = useDragAndDropUploadContext();
  const messageComposer = useMessageComposer();

  // if message input context is available, there's no need to use the queue
  const isWithinMessageInputContext = Object.keys(messageInputContext).length > 0;

  const accept = useMemo(
    () =>
      acceptedFiles.reduce<Record<string, Array<string>>>((mediaTypeMap, mediaType) => {
        mediaTypeMap[mediaType] ??= [];
        return mediaTypeMap;
      }, {}),
    [acceptedFiles],
  );

  const addFilesToQueue = useCallback((files: File[]) => {
    setFiles((cv) => cv.concat(files));
  }, []);

  const removeFilesFromQueue = useCallback((files: File[]) => {
    if (!files.length) return;
    setFiles((cv) => cv.filter((f) => files.indexOf(f) === -1));
  }, []);

  const { isUploadEnabled } = useAttachmentManagerState();
  const { multipleUploads } = useStateStore(
    messageComposer.configState,
    attachmentManagerConfigStateSelector,
  );

  const { getRootProps, isDragActive, isDragReject } = useDropzone({
    accept,
    // apply `disabled` rules if available, otherwise allow anything and
    // let the `uploadNewFiles` handle the limitations internally
    disabled: isWithinMessageInputContext
      ? !isUploadEnabled || (messageInputContext.cooldownRemaining ?? 0) > 0
      : false,
    multiple: multipleUploads,
    noClick: true,
    onDrop: isWithinMessageInputContext
      ? messageComposer.attachmentManager.uploadFiles
      : addFilesToQueue,
  });

  // nested WithDragAndDropUpload components render wrappers without functionality
  // (MessageInputFlat has a default WithDragAndDropUpload)
  if (dragAndDropUploadContext.removeFilesFromQueue !== null) {
    return <Component className={className}>{children}</Component>;
  }

  return (
    <DragAndDropUploadContext.Provider
      value={{ addFilesToQueue, fileQueue: files, removeFilesFromQueue }}
    >
      <Component {...getRootProps({ className, style })}>
        {/* TODO: could be a replaceable component */}
        {isDragActive && (
          <div
            className={clsx('str-chat__dropzone-container', {
              'str-chat__dropzone-container--not-accepted': isDragReject,
            })}
          >
            {!isDragReject && <p>{t<string>('Drag your files here')}</p>}
            {isDragReject && <p>{t<string>('Some of the files will not be accepted')}</p>}
          </div>
        )}
        {children}
      </Component>
    </DragAndDropUploadContext.Provider>
  );
};
