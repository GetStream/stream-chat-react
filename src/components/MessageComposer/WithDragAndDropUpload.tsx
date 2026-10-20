import type { CSSProperties, ElementType, PropsWithChildren } from 'react';
import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';
import type { MessageComposerConfig } from 'stream-chat';

import {
  useComponentContextIcons,
  useIsWithinMessageComposerContext,
  useTranslationContext,
} from '../../context';
import { useAttachmentManagerState, useMessageComposerController } from './hooks';
import { useStateStore } from '../../store';
import { useIsCooldownActive } from './hooks/useIsCooldownActive';

const DragAndDropUploadContext = React.createContext<{
  subscribeToDrop: ((fn: (files: File[]) => void) => () => void) | null;
}>({
  subscribeToDrop: null,
});

export const useDragAndDropUploadContext = () => useContext(DragAndDropUploadContext);

/**
 * Registers the composer's `attachmentManager.uploadFiles` as a drop handler of the enclosing
 * `WithDragAndDropUpload`. Call it once, directly in `MessageComposerProvider`.
 *
 * @private
 */
export const useRegisterDropHandlers = () => {
  const { subscribeToDrop } = useDragAndDropUploadContext();

  const messageComposer = useMessageComposerController();

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
 * Wraps its children in a drop zone that uploads dropped files to the message composers inside it.
 *
 * @example
 * ```tsx
 * <Channel channel={channel}>
 *  <WithDragAndDropUpload component="section" className="message-list-dnd-wrapper">
 *    <MessageList />
 *    <MessageComposer />
 *  </WithDragAndDropUpload>
 * </Channel>
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
   * @description Element rendered as the wrapper that handles drag and drop.
   * @default 'div'
   */
  component?: ElementType;
  className?: string;
  style?: CSSProperties;
}>) => {
  const dropHandlersRef = useRef<Set<(f: File[]) => void>>(new Set());
  const dragAndDropUploadContext = useDragAndDropUploadContext();
  const messageComposer = useMessageComposerController();
  const { isUploadEnabled } = useAttachmentManagerState();
  const { acceptedFiles, multipleUploads } = useStateStore(
    messageComposer.configState,
    attachmentManagerConfigStateSelector,
  );

  const isCooldownActive = useIsCooldownActive();
  // Within a message composer context, that composer handles the drop itself.
  const isWithinMessageComposerContext = useIsWithinMessageComposerContext();

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

  const {
    getRootProps,
    isDragActive,
    isDragReject: isDragRejected,
  } = useDropzone({
    accept,
    // Outside a composer context the zone is never disabled; each composer's `uploadFiles`
    // enforces the limitations internally.
    disabled: isWithinMessageComposerContext
      ? !isUploadEnabled || isCooldownActive
      : false,
    multiple: multipleUploads,
    noClick: true,
    noKeyboard: true,
    onDrop: isWithinMessageComposerContext
      ? messageComposer.attachmentManager.uploadFiles
      : handleDrop,
  });

  // A nested WithDragAndDropUpload, e.g. the one `MessageComposerUI` always renders, is a plain
  // wrapper: the outermost one handles the drop.
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
              'str-chat__dropzone-container--not-accepted': isDragRejected,
            })}
            role='presentation'
          >
            <FileDragAndDropContent isDragRejected={isDragRejected} />
          </div>
        )}
        {children}
      </Component>
    </DragAndDropUploadContext.Provider>
  );
};

export type FileDragAndDropContentProps = {
  isDragRejected: boolean;
};

export const FileDragAndDropContent = ({
  isDragRejected,
}: FileDragAndDropContentProps) => {
  const { IconUpload } = useComponentContextIcons();
  const { t } = useTranslationContext();
  return (
    <div className='str-chat__dropzone-container__content'>
      {isDragRejected ? (
        <p>
          {t(
            'messageComposer.dragDropUpload.someFilesNotAccepted.text',
            'Some of the files will not be accepted',
          )}
        </p>
      ) : (
        <>
          <IconUpload />
          <p>
            {t('messageComposer.dragDropUpload.dragFiles.text', 'Drag your files here')}
          </p>
        </>
      )}
    </div>
  );
};
