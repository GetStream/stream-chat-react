import {
  type ComponentPropsWithoutRef,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type React from 'react';
import { customAlphabet } from 'nanoid';
import clsx from 'clsx';
import { StateStore } from 'stream-chat';

import { useStateStore } from '../../../store';
import { useStableCallback } from '../../../utils/useStableCallback';
import { AttachmentPreview } from './AttachmentPreview';
import { useSpeechToText, type UseSpeechToTextOptions } from './hooks/useSpeechToText';

const nanoId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 15);

const FileInput = ({
  labelProps,
  ...restProps
}: ComponentPropsWithoutRef<'input'> & {
  labelProps?: ComponentPropsWithoutRef<'label'>;
}) => {
  const { disabled } = useIsDisabled();
  return (
    <WithStableId>
      {({ id }) => (
        <>
          <input
            id={id}
            multiple
            style={{ display: 'none' }}
            type='file'
            {...restProps}
            disabled={disabled}
          />
          <label
            className='aicr__ai-message-composer__round-button'
            htmlFor={id}
            tabIndex={0}
            {...labelProps}
          >
            <span className='material-symbols-rounded'>add</span>
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
    file: File;
    id: string;
    meta?: Record<string, unknown>;
  }[];
  text: string;
  disabled?: boolean;
};

const initialStoreState: AIMessageComposerStore = {
  attachments: [],
  disabled: false,
  text: '',
};

const AIMessageComposerContext = createContext<StateStore<AIMessageComposerStore>>(
  new StateStore<AIMessageComposerStore>(initialStoreState),
);

export const useAIMessageComposerContext = () => useContext(AIMessageComposerContext);

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
  return { disabled, setDisabled };
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

  /**
   * Disables the composer.
   */
  disabled?: boolean;
};

interface AIMessageComposer {
  (props: AIMessageComposerProps): React.JSX.Element;
  FileInput: typeof FileInput;
  TextInput: typeof TextInput;
  SpeechToTextButton: typeof SpeechToTextButton;
  SubmitButton: typeof SubmitButton;
  ModelSelect: typeof ModelSelect;
  AttachmentPreview: typeof AttachmentPreview;
}

export const AIMessageComposer: AIMessageComposer = ({
  children,
  disabled,
  nameMapping,
  onChange,
  onReset,
  resetAttachmentsOnSelect = true,
  ...restProps
}) => {
  const [stateStore] = useState(
    () => new StateStore<AIMessageComposerStore>(initialStoreState),
  );

  useEffect(() => {
    stateStore.partialNext({ disabled });
  }, [disabled, stateStore]);

  const handleChange = useStableCallback((e: React.ChangeEvent<HTMLFormElement>) => {
    onChange?.(e);

    const inputElement = e.target as unknown as HTMLInputElement;

    const messageName = nameMapping?.message ?? 'message';
    const attachmentsName = nameMapping?.attachments ?? 'attachments';

    const files = inputElement.name === attachmentsName ? inputElement.files : null;
    const text = inputElement.name === messageName ? inputElement.value : null;

    stateStore.next((currentState) => {
      const newState = { ...currentState };

      if (files && files.length > 0) {
        const newFiles = Array.from(files).map(
          (file) =>
            ({
              file,
              id: nanoId(),
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
  });

  return (
    <AIMessageComposerContext.Provider value={stateStore}>
      <form
        className='aicr__ai-message-composer__form'
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

const noop = () => undefined;

const TextInput = (props: ComponentPropsWithoutRef<'input'>) => {
  const { text } = useText();
  const { disabled } = useIsDisabled();

  return (
    <input
      autoComplete='off'
      className='aicr__ai-message-composer__text-input'
      name='message'
      // React requires onChange when value is set, defaultValue stops working
      // when input gets "dirty"
      // actual on-change is handled at the form level
      onChange={noop}
      placeholder='Ask a question...'
      type='text'
      value={text}
      {...props}
      disabled={disabled}
    />
  );
};

const SpeechToTextButton = (
  props: ComponentPropsWithoutRef<'button'> & {
    options?: UseSpeechToTextOptions;
  },
) => {
  const { setText } = useText();
  const { disabled } = useIsDisabled();

  const { isListening, startListening, stopListening } = useSpeechToText({
    onError: console.error,
    onTranscript: setText,
  });

  return (
    <button
      aria-label='speech-to-text'
      aria-pressed={isListening}
      className='aicr__ai-message-composer__round-button'
      onClick={() => {
        if (isListening) {
          stopListening();
        } else {
          startListening();
        }
      }}
      type='button'
      {...props}
      disabled={disabled}
    >
      <span className='material-symbols-rounded'>mic</span>
    </button>
  );
};

const SubmitButton = ({
  active,
  ...restProps
}: ComponentPropsWithoutRef<'button'> & { active?: boolean }) => {
  const { disabled } = useIsDisabled();
  return (
    <button
      className={clsx(
        'aicr__ai-message-composer__round-button',
        active && 'aicr__ai-message-composer__round-button--active',
      )}
      type='submit'
      {...restProps}
      disabled={disabled}
    >
      <span className='material-symbols-rounded'>send</span>
    </button>
  );
};

const availableModels = [
  { label: 'GPT-4o mini', platform: 'openai', value: 'gpt-4o-mini' },
  { label: 'GPT-4o', platform: 'openai', value: 'gpt-4o' },
] as const;

const [defaultModel] = availableModels;

const defaultPlatformModel = `${defaultModel.platform}|${defaultModel.value}`;

const ModelSelect = (
  props: ComponentPropsWithoutRef<'select'> & { options?: ReactNode },
) => {
  const {
    options = (
      <>
        {availableModels.map((model) => (
          <option key={model.value} value={`${model.platform}|${model.value}`}>
            {model.label}
          </option>
        ))}
      </>
    ),
    ...restProps
  } = props;

  const { disabled } = useIsDisabled();
  return (
    <select
      className='aicr__ai-message-composer__select'
      defaultValue={defaultPlatformModel}
      {...restProps}
      disabled={disabled}
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
