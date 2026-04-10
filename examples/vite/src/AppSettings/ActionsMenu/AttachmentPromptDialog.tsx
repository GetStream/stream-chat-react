import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { LocalAttachment } from 'stream-chat';
import {
  DialogAnchor,
  Prompt,
  useChatContext,
  useDialogIsOpen,
  useDialogOnNearestManager,
} from 'stream-chat-react';

export const attachmentPromptDialogId = 'app-attachment-prompt-dialog';
type AttachmentEditorTab = 'unsupported-file' | 'unsupported-object';

const VIEWPORT_MARGIN = 8;
const defaultUnsupportedAttachment = {
  asset_url: 'https://example.com/unsupported.bin',
  file_size: 128000,
  localMetadata: {
    id: 'unsupported-attachment-1',
    uploadProgress: 100,
    uploadState: 'finished',
  },
  mime_type: 'application/octet-stream',
  title: 'unsupported.bin',
  type: 'unsupported',
};
const defaultUnsupportedObjectAttachment = {
  localMetadata: {
    id: 'unsupported-object-1',
    uploadProgress: 100,
    uploadState: 'finished',
  },
  debug: true,
  metadata: { randomNumber: 7, source: 'vite-preview' },
  title: 'custom payload',
  type: 'custom',
};
const initialUnsupportedFileValue = JSON.stringify(defaultUnsupportedAttachment, null, 2);
const initialUnsupportedObjectValue = JSON.stringify(
  defaultUnsupportedObjectAttachment,
  null,
  2,
);

const clamp = (value: number, min: number, max: number) => {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
};

export const AttachmentPromptDialog = ({
  referenceElement,
}: {
  referenceElement: HTMLElement | null;
}) => {
  const [activeTab, setActiveTab] = useState<AttachmentEditorTab>('unsupported-file');
  const [unsupportedFileInput, setUnsupportedFileInput] = useState(
    initialUnsupportedFileValue,
  );
  const [unsupportedObjectInput, setUnsupportedObjectInput] = useState(
    initialUnsupportedObjectValue,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const shellRef = useRef<HTMLDivElement | null>(null);
  const { channel } = useChatContext();
  const { dialog, dialogManager } = useDialogOnNearestManager({
    id: attachmentPromptDialogId,
  });
  const dialogIsOpen = useDialogIsOpen(attachmentPromptDialogId, dialogManager?.id);

  useEffect(() => {
    if (dialogIsOpen) return;
    setActiveTab('unsupported-file');
    setUnsupportedFileInput(initialUnsupportedFileValue);
    setUnsupportedObjectInput(initialUnsupportedObjectValue);
    setErrorMessage(null);
    setDragOffset({ x: 0, y: 0 });
  }, [dialogIsOpen]);

  useEffect(() => {
    if (!dialogIsOpen) return;

    const clampToViewport = () => {
      const shell = shellRef.current;
      if (!shell) return;

      const rect = shell.getBoundingClientRect();
      const nextLeft = clamp(
        rect.left,
        VIEWPORT_MARGIN,
        window.innerWidth - rect.width - VIEWPORT_MARGIN,
      );
      const nextTop = clamp(
        rect.top,
        VIEWPORT_MARGIN,
        window.innerHeight - rect.height - VIEWPORT_MARGIN,
      );

      if (nextLeft === rect.left && nextTop === rect.top) return;

      setDragOffset((current) => ({
        x: current.x + (nextLeft - rect.left),
        y: current.y + (nextTop - rect.top),
      }));
    };

    window.addEventListener('resize', clampToViewport);

    return () => {
      window.removeEventListener('resize', clampToViewport);
    };
  }, [dialogIsOpen]);

  const closeDialog = useCallback(() => {
    dialog.close();
  }, [dialog]);

  const attachToComposer = useCallback(
    (tab: AttachmentEditorTab) => {
      if (!channel?.messageComposer) {
        setErrorMessage('No active channel selected');
        return;
      }

      let parsedAttachment: LocalAttachment;
      const attachmentInput =
        tab === 'unsupported-file' ? unsupportedFileInput : unsupportedObjectInput;
      try {
        parsedAttachment = JSON.parse(attachmentInput);
      } catch {
        setErrorMessage('Attachment is not valid JSON');
        return;
      }

      const currentAttachments =
        channel.messageComposer.attachmentManager.state.getLatestValue().attachments;

      channel.messageComposer.attachmentManager.upsertAttachments([
        ...currentAttachments,
        parsedAttachment,
      ]);
      closeDialog();
    },
    [channel, closeDialog, unsupportedFileInput, unsupportedObjectInput],
  );

  const handleHeaderPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      if (!(event.target instanceof HTMLElement)) return;
      if (event.target.closest('button')) return;

      const shell = shellRef.current;
      if (!shell) return;

      event.preventDefault();

      const startClientX = event.clientX;
      const startClientY = event.clientY;
      const startOffset = dragOffset;
      const startRect = shell.getBoundingClientRect();

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const nextLeft = clamp(
          startRect.left + (moveEvent.clientX - startClientX),
          VIEWPORT_MARGIN,
          window.innerWidth - startRect.width - VIEWPORT_MARGIN,
        );
        const nextTop = clamp(
          startRect.top + (moveEvent.clientY - startClientY),
          VIEWPORT_MARGIN,
          window.innerHeight - startRect.height - VIEWPORT_MARGIN,
        );

        setDragOffset({
          x: startOffset.x + (nextLeft - startRect.left),
          y: startOffset.y + (nextTop - startRect.top),
        });
      };

      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [dragOffset],
  );

  const shellStyle = {
    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
  };

  return (
    <DialogAnchor
      allowFlip
      className='app__attachment-dialog'
      dialogManagerId={dialogManager?.id}
      id={attachmentPromptDialogId}
      placement='right-start'
      referenceElement={referenceElement}
      tabIndex={-1}
      trapFocus
      updatePositionOnContentResize
    >
      <div className='app__attachment-dialog__shell' ref={shellRef} style={shellStyle}>
        <Prompt.Root className='app__attachment-dialog__prompt'>
          <div
            className='app__attachment-dialog__drag-handle'
            onPointerDown={handleHeaderPointerDown}
          >
            <Prompt.Header close={closeDialog} title='Message Composer' />
          </div>
          <Prompt.Body className='app__attachment-dialog__body'>
            <div className='app__attachment-dialog__subsection'>
              <h3 className='app__attachment-dialog__subsection-title'>
                Attach Unsupported Attachment
              </h3>
              <div
                aria-label='Attachment type'
                className='app__attachment-dialog__tabs'
                role='tablist'
              >
                <button
                  aria-selected={activeTab === 'unsupported-file'}
                  className='app__attachment-dialog__tab'
                  onClick={() => {
                    setActiveTab('unsupported-file');
                    if (errorMessage) setErrorMessage(null);
                  }}
                  role='tab'
                  type='button'
                >
                  Unsupported file
                </button>
                <button
                  aria-selected={activeTab === 'unsupported-object'}
                  className='app__attachment-dialog__tab'
                  onClick={() => {
                    setActiveTab('unsupported-object');
                    if (errorMessage) setErrorMessage(null);
                  }}
                  role='tab'
                  type='button'
                >
                  Unsupported object
                </button>
              </div>
              <label className='app__attachment-dialog__field'>
                <span className='app__attachment-dialog__field-label'>
                  Attachment JSON
                </span>
                <textarea
                  className='app__attachment-dialog__textarea'
                  onChange={(event) => {
                    if (activeTab === 'unsupported-file') {
                      setUnsupportedFileInput(event.target.value);
                    } else {
                      setUnsupportedObjectInput(event.target.value);
                    }
                    if (errorMessage) setErrorMessage(null);
                  }}
                  rows={12}
                  spellCheck={false}
                  value={
                    activeTab === 'unsupported-file'
                      ? unsupportedFileInput
                      : unsupportedObjectInput
                  }
                />
              </label>
              <div className='app__attachment-dialog__subsection-actions'>
                {activeTab === 'unsupported-file' ? (
                  <Prompt.FooterControlsButtonPrimary
                    size='sm'
                    onClick={() => attachToComposer('unsupported-file')}
                  >
                    Attach Unsupported file
                  </Prompt.FooterControlsButtonPrimary>
                ) : (
                  <Prompt.FooterControlsButtonPrimary
                    size='sm'
                    onClick={() => attachToComposer('unsupported-object')}
                  >
                    Attach Unsupported object
                  </Prompt.FooterControlsButtonPrimary>
                )}
              </div>
              {errorMessage && (
                <div className='app__attachment-dialog__error' role='alert'>
                  {errorMessage}
                </div>
              )}
            </div>
          </Prompt.Body>
        </Prompt.Root>
      </div>
    </DialogAnchor>
  );
};
