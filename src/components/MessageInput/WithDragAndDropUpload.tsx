import type { CSSProperties, ElementType, PropsWithChildren } from 'react';
import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';
import type { MessageComposerConfig } from 'stream-chat';

import { useMessageInputContext, useTranslationContext } from '../../context';
import { useAttachmentManagerState, useMessageComposer } from './hooks';
import { useStateStore } from '../../store';
import { useIsCooldownActive } from './hooks/useIsCooldownActive';
import { IconFileArrowLeftIn } from '../Icons';

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
  acceptedFiles: state.attachments.acceptedFiles,
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
  acceptedFiles?: string[];
  /**
   * @description An element to render as a wrapper onto which drag & drop functionality will be applied.
   * @default 'div'
   */
  component?: ElementType;
  className?: string;
  style?: CSSProperties;
}>) => {
  const dropHandlersRef = useRef<Set<(f: File[]) => void>>(new Set());
  const { t } = useTranslationContext();

  const messageInputContext = useMessageInputContext();
  const dragAndDropUploadContext = useDragAndDropUploadContext();
  const messageComposer = useMessageComposer();
  const { isUploadEnabled } = useAttachmentManagerState();
  const { acceptedFiles, multipleUploads } = useStateStore(
    messageComposer.configState,
    attachmentManagerConfigStateSelector,
  );

  const isCooldownActive = useIsCooldownActive();
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

  const { getRootProps, isDragActive, isDragReject } = useDropzone({
    accept,
    // apply `disabled` rules if available, otherwise allow anything and
    // let the `uploadNewFiles` handle the limitations internally
    disabled: isWithinMessageInputContext ? !isUploadEnabled || isCooldownActive : false,
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

  const rootClassName = clsx('str-chat__dropzone-root', className);

  return (
    <DragAndDropUploadContext.Provider value={{ subscribeToDrop }}>
      <Component {...getRootProps({ className: rootClassName, style })}>
        {isDragActive && (
          <div
            className={clsx('str-chat__dropzone-container', {
              'str-chat__dropzone-container--not-accepted': isDragReject,
            })}
            role='presentation'
          >
            <div className='str-chat__dropzone-container__content'>
              {isDragReject ? (
                <p>{t('Some of the files will not be accepted')}</p>
              ) : (
                <>
                  <IconFileArrowLeftIn />
                  <p>{t('Drag your files here')}</p>
                </>
              )}
            </div>
          </div>
        )}
        {children}
      </Component>
    </DragAndDropUploadContext.Provider>
  );
};
