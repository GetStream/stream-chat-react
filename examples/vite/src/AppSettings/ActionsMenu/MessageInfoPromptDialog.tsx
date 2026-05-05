import { useMemo } from 'react';
import type { LocalMessage } from 'stream-chat';
import { Prompt } from 'stream-chat-react';

import { DraggableDialog } from './DraggableDialog';

const safeJsonStringify = (value: unknown) => {
  const seen = new WeakSet<object>();

  return JSON.stringify(
    value,
    (_, currentValue: unknown) => {
      if (typeof currentValue === 'bigint') return currentValue.toString();
      if (!currentValue || typeof currentValue !== 'object') return currentValue;
      if (seen.has(currentValue)) return '[Circular]';
      seen.add(currentValue);
      return currentValue;
    },
    2,
  );
};

export const messageInfoPromptDialogId = 'app-message-info-prompt-dialog';

export const MessageInfoPromptDialog = ({
  dialogId,
  dialogIsOpen,
  dialogManagerId,
  message,
  onClose,
  referenceElement,
}: {
  dialogId: string;
  dialogIsOpen: boolean;
  dialogManagerId?: string;
  message: LocalMessage | null;
  onClose: () => void;
  referenceElement: HTMLElement | null;
}) => {
  const messageJson = useMemo(() => {
    if (!message) return '';

    try {
      return safeJsonStringify(message);
    } catch (error) {
      if (error instanceof Error) return error.message;
      return 'Unable to serialize message';
    }
  }, [message]);

  return (
    <DraggableDialog
      dialogClassName='app__message-info-dialog'
      dialogId={dialogId}
      dialogIsOpen={dialogIsOpen}
      dialogManagerId={dialogManagerId}
      dragHandleClassName='app__message-info-dialog__drag-handle'
      onClose={onClose}
      promptClassName='app__message-info-dialog__prompt'
      referenceElement={referenceElement}
      shellClassName='app__message-info-dialog__shell'
      title='Message info'
    >
      <Prompt.Body className='app__message-info-dialog__body'>
        <div className='app__message-info-dialog__field'>
          <span className='app__message-info-dialog__field-label'>Message JSON</span>
          <pre className='app__message-info-dialog__code-block'>
            <code>{messageJson}</code>
          </pre>
        </div>
      </Prompt.Body>
    </DraggableDialog>
  );
};
