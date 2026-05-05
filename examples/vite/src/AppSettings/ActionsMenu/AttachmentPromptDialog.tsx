import { useCallback, useEffect, useState } from 'react';
import type { LocalAttachment } from 'stream-chat';
import {
  Prompt,
  useChatContext,
  useDialogIsOpen,
  useDialogOnNearestManager,
} from 'stream-chat-react';
import { DraggableDialog } from './DraggableDialog';

export const attachmentPromptDialogId = 'app-attachment-prompt-dialog';
type AttachmentEditorTab = 'unsupported-file' | 'unsupported-object';

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

  return (
    <DraggableDialog
      dialogClassName='app__attachment-dialog'
      dialogId={attachmentPromptDialogId}
      dialogIsOpen={dialogIsOpen}
      dialogManagerId={dialogManager?.id}
      dragHandleClassName='app__attachment-dialog__drag-handle'
      onClose={closeDialog}
      promptClassName='app__attachment-dialog__prompt'
      referenceElement={referenceElement}
      shellClassName='app__attachment-dialog__shell'
      title='Message Composer'
    >
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
            <span className='app__attachment-dialog__field-label'>Attachment JSON</span>
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
    </DraggableDialog>
  );
};
