import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
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
export const useRegisterDropHandlers = () => {
  const { subscribeToDrop } = useDragAndDropUploadContext();

  const messageComposer = useMessageComposer();

  useEffect(() => {
    const unsubscribe = subscribeToDrop?.(messageComposer.attachmentManager.uploadFiles);

    return unsubscribe;
  }, [subscribeToDrop, messageComposer]);
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
  const dropHandlersRef = useRef<Set<(f: File[]) => void>>(new Set());
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

  const subscribeToDrop = useCallback((fn: (files: File[]) => void) => {
    dropHandlersRef.current.add(fn);

    return () => {
      dropHandlersRef.current.delete(fn);
    };
  }, []);

  const handleDrop = useCallback((files: File[]) => {
    dropHandlersRef.current.forEach((fn) => fn(files));
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
      : handleDrop,
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
