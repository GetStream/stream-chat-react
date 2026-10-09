import {
  type ComponentPropsWithoutRef,
  createContext,
  type CSSProperties,
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
import { StateStore } from '@stream-io/state-store';

import { useComponentContextIcons } from '../../../context/useComponentContextIcons';
import { useTranslationContext } from '../../../context/TranslationContext';
import { useStateStore } from '../../../store';
import { useStableCallback } from '../../../utils/useStableCallback';
import { useStableId } from '../../../components/UtilityComponents/useStableId';
import { AttachmentPreview } from './AttachmentPreview';
import { useSpeechToText, type UseSpeechToTextOptions } from './hooks/useSpeechToText';

const nanoId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 15);

// Visually hidden but still focusable: the native file input is the keyboard
// target (Enter/Space open the picker, it is announced with its aria-label),
// while the label is the visual/pointer target.
const visuallyHiddenInputStyle: CSSProperties = {
  border: 0,
  clip: 'rect(0, 0, 0, 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
};

const FileInput = ({
  className,
  labelProps,
  style,
  ...restProps
}: ComponentPropsWithoutRef<'input'> & {
  labelProps?: ComponentPropsWithoutRef<'label'>;
}) => {
  const { disabled } = useIsDisabled();
  const { t } = useTranslationContext();
  const { IconPlus } = useComponentContextIcons();
  return (
    <WithStableId>
      {({ id }) => (
        <>
          <input
            aria-label={t('fileUpload.uploadButton.fileUpload.ariaLabel', 'File upload')}
            className={clsx('str-chat__ai-message-composer__file-input', className)}
            id={id}
            multiple
            style={{ ...visuallyHiddenInputStyle, ...style }}
            type='file'
            {...restProps}
            disabled={disabled}
          />
          <label
            className='str-chat__ai-message-composer__round-button'
            htmlFor={id}
            {...labelProps}
          >
            <IconPlus />
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
  // SSR/hydration-safe on React 18+ (React.useId), client-only id on React 17
  const id = `file-input-${useStableId()}`;

  return <>{typeof children === 'function' ? children({ id }) : children}</>;
};

FileInput.WithStableId = WithStableId;

export type AIMessageComposerStore = {
  attachments: {
    file: File;
    id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- public type kept identical to @stream-io/chat-react-ai@0.2.0 for drop-in migration
    meta?: Record<string, any>;
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

  const handleReset = useStableCallback((e: React.FormEvent<HTMLFormElement>) => {
    onReset?.(e);
    // a reset clears the draft but must not re-enable a composer disabled via props
    stateStore.next({ ...initialStoreState, disabled });
  });

  return (
    <AIMessageComposerContext.Provider value={stateStore}>
      <form
        className='str-chat__ai-message-composer__form'
        onChange={handleChange}
        onReset={handleReset}
        {...restProps}
      >
        {children}
      </form>
    </AIMessageComposerContext.Provider>
  );
};

const noop = () => undefined;

const useHasMounted = () => {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);
  return hasMounted;
};

const TextInput = (props: ComponentPropsWithoutRef<'input'>) => {
  const { text } = useText();
  const { disabled } = useIsDisabled();
  const { t } = useTranslationContext();

  return (
    <input
      autoComplete='off'
      className='str-chat__ai-message-composer__text-input'
      name='message'
      // React requires onChange when value is set, defaultValue stops working
      // when input gets "dirty"
      // actual on-change is handled at the form level
      onChange={noop}
      placeholder={t(
        'aiComponents.messageComposer.textInput.placeholder',
        'Ask a question...',
      )}
      type='text'
      value={text}
      {...props}
      disabled={disabled}
    />
  );
};

const SpeechToTextButton = ({
  options,
  ...restProps
}: ComponentPropsWithoutRef<'button'> & {
  options?: UseSpeechToTextOptions;
}) => {
  const { setText } = useText();
  const { disabled } = useIsDisabled();
  const { t } = useTranslationContext();
  const { IconMicrophoneSolid } = useComponentContextIcons();
  const hasMounted = useHasMounted();

  // stable identities: the recognizer is only re-created when a primitive option changes
  const onTranscript = useStableCallback((text: string) => {
    setText(text);
    options?.onTranscript?.(text);
  });
  const onError = useStableCallback((error: string) => {
    if (options?.onError) {
      options.onError(error);
    } else {
      console.error(error);
    }
  });

  const { isListening, isSupported, startListening, stopListening } = useSpeechToText({
    ...options,
    onError,
    onTranscript,
  });

  // Render nothing without the Web Speech API. Support is only known in the
  // browser, so wait for mount to keep the server and hydration markup equal.
  if (!hasMounted || !isSupported) return null;

  return (
    <button
      aria-label={t(
        'aiComponents.messageComposer.speechToText.ariaLabel',
        'Start voice input',
      )}
      aria-pressed={isListening}
      className='str-chat__ai-message-composer__round-button'
      onClick={() => {
        if (isListening) {
          stopListening();
        } else {
          startListening();
        }
      }}
      type='button'
      {...restProps}
      disabled={disabled}
    >
      <IconMicrophoneSolid />
    </button>
  );
};

const SubmitButton = ({
  active,
  ...restProps
}: ComponentPropsWithoutRef<'button'> & { active?: boolean }) => {
  const { disabled } = useIsDisabled();
  const { t } = useTranslationContext();
  const { IconSend } = useComponentContextIcons();
  return (
    <button
      aria-label={t('messageComposer.sendButton.send.ariaLabel', 'Send')}
      className={clsx(
        'str-chat__ai-message-composer__round-button',
        active && 'str-chat__ai-message-composer__round-button--active',
      )}
      type='submit'
      {...restProps}
      disabled={disabled}
    >
      <IconSend />
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
      className='str-chat__ai-message-composer__select'
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
