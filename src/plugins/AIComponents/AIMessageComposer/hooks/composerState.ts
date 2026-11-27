import { createContext, useCallback, useContext, useMemo } from 'react';
import { StateStore } from '@stream-io/state-store';

import { useStateStore } from '../../../../store';
import { type AIMessageComposerStore, initialAIMessageComposerState } from '../store';

// The state the composer's parts share: the composer's store, and whether its `disabled` prop
// is set. The prop is the composer's own, so it isn't written into the store, which a
// conversation's composers share.

export const AIMessageComposerContext = createContext<
  StateStore<AIMessageComposerStore> | undefined
>(undefined);

export const AIMessageComposerDisabledContext = createContext(false);

let fallbackStore: StateStore<AIMessageComposerStore> | undefined;
let warnedOutsideComposer = false;

/**
 * The store of the `AIMessageComposer` around the component. Outside one, a store of its own,
 * shared by every such use, with a warning once: the composer's hooks belong inside it.
 */
export const useAIMessageComposerContext = () => {
  const store = useContext(AIMessageComposerContext);
  if (store) return store;
  if (!warnedOutsideComposer) {
    warnedOutsideComposer = true;
    console.warn(
      "stream-chat-react/ai-components: a composer hook (useText, useAttachments, useIsDisabled or useAIMessageComposerContext) is used outside an AIMessageComposer, so it reads a store of its own that the composer doesn't see.",
    );
  }
  fallbackStore ??= new StateStore<AIMessageComposerStore>(initialAIMessageComposerState);
  return fallbackStore;
};

export const useAttachments = () => {
  const store = useAIMessageComposerContext();

  const removeAttachment = useCallback(
    (idOrFile: string | File) => {
      store.next((currentState) => ({
        ...currentState,
        attachments: currentState.attachments.filter((attachment) => {
          if (typeof idOrFile === 'string') {
            return attachment.id !== idOrFile;
          }

          return attachment.file !== idOrFile;
        }),
      }));
    },
    [store],
  );

  const updateAttachments = useCallback(
    (
      idsOrAttachments: (string | AIMessageComposerStore['attachments'][number])[],
      update: (
        attachment: AIMessageComposerStore['attachments'][number],
      ) => AIMessageComposerStore['attachments'][number],
    ) => {
      store.next((currentState) => {
        let hasChanges = false;
        const newAttachments = [...currentState.attachments];

        for (const idOrAttachment of idsOrAttachments) {
          const attachmentIndex =
            typeof idOrAttachment === 'string'
              ? currentState.attachments.findIndex((a) => a.id === idOrAttachment)
              : currentState.attachments.indexOf(idOrAttachment);

          if (attachmentIndex === -1) {
            continue;
          }

          const currentAttachment = currentState.attachments[attachmentIndex];
          if (!currentAttachment) continue;

          const updatedAttachment = update(currentAttachment);

          if (updatedAttachment !== currentAttachment) {
            newAttachments[attachmentIndex] = updatedAttachment;
            hasChanges = true;
          }
        }

        if (!hasChanges) {
          return currentState;
        }

        return {
          ...currentState,
          attachments: newAttachments,
        };
      });
    },
    [store],
  );

  const selector = useCallback(
    (currentState: AIMessageComposerStore) => ({
      attachments: currentState.attachments,
    }),
    [],
  );

  const { attachments } = useStateStore(store, selector);

  return useMemo(
    () => ({ attachments, removeAttachment, updateAttachments }),
    [attachments, removeAttachment, updateAttachments],
  );
};

export const useText = () => {
  const store = useAIMessageComposerContext();

  const selector = useCallback(
    (currentState: AIMessageComposerStore) => ({
      text: currentState.text,
    }),
    [],
  );

  const setText = useCallback(
    (text: string) => {
      store.next((currentState) => {
        if (currentState.text === text) {
          return currentState;
        }

        return {
          ...currentState,
          text,
        };
      });
    },
    [store],
  );

  const { text } = useStateStore(store, selector);

  return { setText, text };
};

export const useIsDisabled = () => {
  const store = useAIMessageComposerContext();
  const selector = useCallback(
    (currentState: AIMessageComposerStore) => ({
      disabled: currentState.disabled,
    }),
    [],
  );

  const setDisabled = useCallback(
    (disabled: boolean) => store.partialNext({ disabled }),
    [store],
  );

  const { disabled } = useStateStore(store, selector);
  const disabledByProp = useContext(AIMessageComposerDisabledContext);
  return { disabled: disabledByProp || !!disabled, setDisabled };
};
