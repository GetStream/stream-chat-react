import React, {
  CSSProperties,
  ElementType,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  subscribeToDrop: ((fn: (files: File[]) => void) => () => void) | null;
}>({
  subscribeToDrop: null,
});

export const useDragAndDropUploadContext = () => useContext(DragAndDropUploadContext);

/**
 * @private This hook should be used only once directly in the `MessageInputProvider` to
 * register `uploadNewFiles` functions of the rendered `MessageInputs`. Each `MessageInput`
 * will then be notified when the drop event occurs from within the `WithDragAndDropUpload`
 * component.
 */
export const useRegisterDropHandlers = ({ uploadNewFiles }: MessageInputContextValue) => {
  const { subscribeToDrop } = useDragAndDropUploadContext();

  useEffect(() => {
    const unsubscribe = subscribeToDrop?.(uploadNewFiles);

    return unsubscribe;
  }, [subscribeToDrop, uploadNewFiles]);
};

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
  const dropHandlersRef = useRef<Set<(f: File[]) => void>>(new Set());
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

  const subscribeToDrop = useCallback((fn: (files: File[]) => void) => {
    dropHandlersRef.current.add(fn);

    return () => {
      dropHandlersRef.current.delete(fn);
    };
  }, []);

  const handleDrop = useCallback((files: File[]) => {
    dropHandlersRef.current.forEach((fn) => fn(files));
  }, []);

  const { getRootProps, isDragActive, isDragReject } = useDropzone({
    accept,
    // apply `disabled` rules if available, otherwise allow anything and
    // let the `uploadNewFiles` handle the limitations internally
    disabled: isWithinMessageInputContext
      ? !messageInputContext.isUploadEnabled || messageInputContext.maxFilesLeft === 0
      : false,
    multiple: multipleUploads,
    noClick: true,
    onDrop: isWithinMessageInputContext ? messageInputContext.uploadNewFiles : handleDrop,
  });

  // nested WithDragAndDropUpload components render wrappers without functionality
  // (MessageInputFlat has a default WithDragAndDropUpload)
  if (dragAndDropUploadContext.subscribeToDrop !== null) {
    return <Component className={className}>{children}</Component>;
  }

  return (
    <DragAndDropUploadContext.Provider
      value={{
        subscribeToDrop,
      }}
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
