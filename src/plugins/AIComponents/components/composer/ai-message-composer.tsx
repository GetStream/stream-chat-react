import {
  type ComponentPropsWithoutRef,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { customAlphabet } from 'nanoid';
import { StateStore } from '@stream-io/state-store';
import { useStateStore } from '@stream-io/state-store/react-bindings';

import { AttachmentPreview } from './attachment-preview';
import { useSpeechToText } from './use-speech-to-text';
import { useStableCallback } from '../../hooks/use-stable-callback';

const nanoId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 15);

const FileInput = ({
  labelProps,
  ...restProps
}: ComponentPropsWithoutRef<'input'> & {
  labelProps?: ComponentPropsWithoutRef<'label'>;
}) => {
  return (
    <WithStableId>
      {({ id }) => (
        <>
          <input
            style={{ display: 'none' }}
            multiple
            type="file"
            id={id}
            {...restProps}
          />
          <label
            className="aicr__ai-message-composer__round-button"
            htmlFor={id}
            tabIndex={0}
            {...labelProps}
          >
            <span className="material-symbols-rounded">add</span>
          </label>
        </>
      )}
    </WithStableId>
  );
};

const WithStableId = ({
  children,
}: {
  children?: ReactNode | (({ id }: { id: string }) => ReactNode);
}) => {
  const id = useMemo(() => `file-input-${nanoId()}`, []);

  return <>{typeof children === 'function' ? children({ id }) : children}</>;
};

FileInput.WithStableId = WithStableId;

export type AIMessageComposerStore = {
  attachments: {
    id: string;
    file: File;
    meta?: Record<string, any>;
  }[];
  text: string;
};

const initialStoreState: AIMessageComposerStore = {
  attachments: [],
  text: '',
};

const AIMessageComposerContext = createContext<
  StateStore<AIMessageComposerStore>
>(new StateStore<AIMessageComposerStore>(initialStoreState));

export const useAIMessageComposerContext = () =>
  useContext(AIMessageComposerContext);

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
      idsOrAttachments: (
        | string
        | AIMessageComposerStore['attachments'][number]
      )[],
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
              ? currentState.attachments.findIndex(
                  (a) => a.id === idOrAttachment,
                )
              : currentState.attachments.indexOf(idOrAttachment);

          if (attachmentIndex === -1) {
            continue;
          }

          const updatedAttachment = update(
            currentState.attachments[attachmentIndex]!,
          );

          if (
            updatedAttachment !== currentState.attachments[attachmentIndex]!
          ) {
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

  return { text, setText };
};

type AIMessageComposerProps = ComponentPropsWithoutRef<'form'> & {
  /**
   * Resets a value of an input with name `attachments` and of type `file` when user selects files so that
   * they can select the same file again if needed.
   *
   * @default true
   */
  resetAttachmentsOnSelect?: boolean;
  nameMapping?: {
    message?: string;
    attachments?: string;
  };
};

interface AIMessageComposer {
  (props: AIMessageComposerProps): JSX.Element;
  FileInput: typeof FileInput;
  TextInput: typeof TextInput;
  SpeechToTextButton: typeof SpeechToTextButton;
  SubmitButton: typeof SubmitButton;
  ModelSelect: typeof ModelSelect;
  AttachmentPreview: typeof AttachmentPreview;
}

export const AIMessageComposer: AIMessageComposer = ({
  children,
  onChange,
  onReset,
  resetAttachmentsOnSelect = true,
  nameMapping,
  ...restProps
}) => {
  const [stateStore] = useState(
    () => new StateStore<AIMessageComposerStore>(initialStoreState),
  );

  const handleChange = useStableCallback(
    (e: React.ChangeEvent<HTMLFormElement>) => {
      onChange?.(e);

      const inputElement = e.target as unknown as HTMLInputElement;

      const messageName = nameMapping?.message ?? 'message';
      const attachmentsName = nameMapping?.attachments ?? 'attachments';

      const files =
        inputElement.name === attachmentsName ? inputElement.files : null;
      const text =
        inputElement.name === messageName ? inputElement.value : null;

      stateStore.next((currentState) => {
        const newState = { ...currentState };

        if (files && files.length > 0) {
          const newFiles = Array.from(files).map(
            (file) =>
              ({
                id: nanoId(),
                file,
              }) satisfies AIMessageComposerStore['attachments'][number],
          );

          newState.attachments = newState.attachments.concat(newFiles);
        }

        if (text !== null) {
          newState.text = text;
        }

        if (
          newState.attachments !== currentState.attachments ||
          newState.text !== currentState.text
        ) {
          return newState;
        }

        return currentState;
      });

      if (
        resetAttachmentsOnSelect &&
        inputElement.type === 'file' &&
        inputElement.name === attachmentsName
      ) {
        inputElement.value = '';
      }
    },
  );

  return (
    <AIMessageComposerContext.Provider value={stateStore}>
      <form
        className="aicr__ai-message-composer__form"
        onChange={handleChange}
        onReset={(e) => {
          onReset?.(e);
          stateStore.next(initialStoreState);
        }}
        {...restProps}
      >
        {children}
      </form>
    </AIMessageComposerContext.Provider>
  );
};

const noop = () => {};

const TextInput = (props: ComponentPropsWithoutRef<'input'>) => {
  const { text } = useText();

  return (
    <input
      value={text}
      // React requires onChange when value is set, defaultValue stops working
      // when input gets "dirty"
      // actual on-change is handled at the form level
      onChange={noop}
      className="aicr__ai-message-composer__text-input"
      autoComplete="off"
      type="text"
      name="message"
      placeholder="Ask a question..."
      {...props}
    />
  );
};

const SpeechToTextButton = (props: ComponentPropsWithoutRef<'button'>) => {
  const { setText } = useText();

  const { startListening, stopListening, isListening } = useSpeechToText({
    onTranscript: setText,
    onError: console.error,
  });

  return (
    <button
      className="aicr__ai-message-composer__round-button"
      aria-pressed={isListening}
      onClick={() => {
        if (isListening) {
          stopListening();
        } else {
          startListening();
        }
      }}
      aria-label="speech-to-text"
      type="button"
      {...props}
    >
      <span className="material-symbols-rounded">mic</span>
    </button>
  );
};

const SubmitButton = (props: ComponentPropsWithoutRef<'button'>) => {
  return (
    <button
      className="aicr__ai-message-composer__round-button"
      type="submit"
      {...props}
    >
      <span className="material-symbols-rounded">send</span>
    </button>
  );
};

const ModelSelect = (
  props: ComponentPropsWithoutRef<'select'> & { options?: ReactNode },
) => {
  const {
    options = (
      <>
        <option value="gpt-5">GPT-5</option>
        <option value="gpt-4o">GPT-4o</option>
      </>
    ),
    ...restProps
  } = props;

  return (
    <select
      className="aicr__ai-message-composer__select"
      defaultValue="gpt-4o"
      {...restProps}
    >
      {options}
    </select>
  );
};

AIMessageComposer.FileInput = FileInput;
AIMessageComposer.TextInput = TextInput;
AIMessageComposer.SpeechToTextButton = SpeechToTextButton;
AIMessageComposer.SubmitButton = SubmitButton;
AIMessageComposer.ModelSelect = ModelSelect;
AIMessageComposer.AttachmentPreview = AttachmentPreview;
