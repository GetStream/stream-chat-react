import React, {
  CSSProperties,
  ElementType,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  MessageInputContextValue,
  useChannelStateContext,
  useMessageInputContext,
  useTranslationContext,
} from '../../context';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';

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
 * forwarded files are immediately after removed from the queue.
 */
export const useHandleDragAndDropQueuedFiles = ({
  uploadNewFiles,
}: MessageInputContextValue) => {
  const { fileQueue, removeFilesFromQueue } = useDragAndDropUploadContext();

  // const uploadNewFilesReference = useRef<((f: File[]) => void) | undefined>(undefined);

  // uploadNewFilesReference.current = (f) => messageInputContextValue.uploadNewFiles(f);

  useEffect(() => {
    if (!removeFilesFromQueue) return;

    // uploadNewFilesReference.current?.(fileQueue);
    uploadNewFiles(fileQueue);

    removeFilesFromQueue(fileQueue);
  }, [fileQueue, removeFilesFromQueue, uploadNewFiles]);
};

/**
 * Wrapper to replace now deprecated `Channel.dragAndDropWindow` option.
 *
 * @example
 * ```tsx
 * <Channel>
 *  <WithDragAndDropUpload as="section" className="message-list-dnd-wrapper">
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
  as: Component = 'div',
  children,
  className,
  style,
}: PropsWithChildren<{
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}>) => {
  const [files, setFiles] = useState<File[]>([]);
  const { acceptedFiles = [], multipleUploads } = useChannelStateContext();
  const { t } = useTranslationContext();

  const messageInputContext = useMessageInputContext();
  const dragAndDropUploadContext = useDragAndDropUploadContext();

  // if message input context is available, there's no need to use the queue
  const isWithinMessageInputContext =
    typeof messageInputContext.uploadNewFiles === 'function';

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

  const { getRootProps, isDragActive, isDragReject } = useDropzone({
    accept,
    disabled: isWithinMessageInputContext
      ? !messageInputContext.isUploadEnabled || messageInputContext.maxFilesLeft === 0
      : false,
    multiple: multipleUploads,
    noClick: true,
    onDrop: isWithinMessageInputContext
      ? messageInputContext.uploadNewFiles
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
