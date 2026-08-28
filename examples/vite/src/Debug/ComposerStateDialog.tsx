import { useCallback, useMemo } from 'react';
import { Prompt, useChatContext, useDialogIsOpen } from 'stream-chat-react';

import { DraggableDialog } from '../AppSettings/ActionsMenu/DraggableDialog';
import { usePersistentDialog } from '../AppSettings/ActionsMenu/usePersistentDialog';
import { ComposerStateInspectorPanel } from './ComposerStateInspector';
import { listComposers } from './composerRegistry';

export const composerStateDialogId = 'app-composer-state-dialog';

/**
 * Registers the inspector's dialog with outside-click dismissal disabled.
 *
 * MUST be used by every caller that touches this dialog id — `DialogManager.getOrCreate`
 * only applies `closeOnClickOutside` when it *creates* the dialog, and the Actions menu
 * resolves it first in order to expose an `open()`. If the menu registered it without the
 * override, whatever this component passed later would be silently ignored.
 *
 * `useDialogOnNearestManager` cannot be used here because it accepts only `id`.
 */
export const useComposerStateDialog = () => usePersistentDialog(composerStateDialogId);

/**
 * Live inspector for any `MessageComposer` the client currently holds.
 *
 * Rendered next to the Actions menu rather than inside `<Channel>`: it resolves composers from
 * `useChatContext()` and the client's composer cache instead of `useMessageComposerController()`,
 * so it can show the channel composer *and* thread/edit composers at once — and it does not need
 * to live in the channel subtree to do it.
 *
 * Dismissal is deliberately limited to the close button: an inspector you have to keep
 * reopening every time you click into the composer is useless for watching state change.
 */
export const ComposerStateDialog = ({
  referenceElement,
}: {
  referenceElement: HTMLElement | null;
}) => {
  const { channel, client } = useChatContext('ComposerStateDialog');
  const { dialog, dialogManager } = useComposerStateDialog();
  const dialogIsOpen = useDialogIsOpen(composerStateDialogId, dialogManager?.id);

  const closeDialog = useCallback(() => {
    dialog.close();
  }, [dialog]);

  // Recomputed on every open so newly created thread/edit composers show up.
  const composers = useMemo(
    () => (dialogIsOpen ? listComposers(client, channel) : []),
    [channel, client, dialogIsOpen],
  );

  return (
    <DraggableDialog
      closeOnClickOutside={false}
      closeOnEscape={false}
      dialogClassName='app__composer-inspector-dialog'
      dialogId={composerStateDialogId}
      dialogIsOpen={dialogIsOpen}
      dialogManagerId={dialogManager?.id}
      dragHandleClassName='app__composer-inspector-dialog__drag-handle'
      // Non-modal on purpose: no focus trap, and opening it must not steal focus from the
      // composer. The overlay is already `pointer-events: none`, so with the trap gone the
      // whole app underneath stays clickable.
      focus={false}
      onClose={closeDialog}
      promptClassName='app__composer-inspector-dialog__prompt'
      referenceElement={referenceElement}
      shellClassName='app__composer-inspector-dialog__shell'
      title='Composer state'
      trapFocus={false}
    >
      <Prompt.Body className='app__composer-inspector'>
        {client ? (
          <ComposerStateInspectorPanel client={client} composers={composers} />
        ) : (
          <div className='app__composer-inspector__empty'>No client connected.</div>
        )}
      </Prompt.Body>
    </DraggableDialog>
  );
};
