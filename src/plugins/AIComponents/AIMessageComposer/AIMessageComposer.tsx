import {
  type ComponentPropsWithoutRef,
  createContext,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type React from 'react';
import { customAlphabet } from 'nanoid';
import clsx from 'clsx';
import { StateStore } from 'stream-chat';

import { useComponentContextIcons } from '../../../context/useComponentContextIcons';
import { useTranslationContext } from '../../../context/TranslationContext';
import { useStateStore } from '../../../store';
import { useStableCallback } from '../../../utils/useStableCallback';
import { useStableId } from '../../../components/UtilityComponents/useStableId';
import { AttachmentPreview } from './AttachmentPreview';
import { ChatOptions as ChatOptionsBase, type ChatOptionsProps } from './ChatOptions';
import { useSpeechToText, type UseSpeechToTextOptions } from './hooks/useSpeechToText';
import { ThemeScopeProvider, useAIThemeScopeClassName } from '../themeScope';
import type {
  AIConversationController,
  AIConversationControllerState,
} from '../Conversation/controller/AIConversationController';
import { isAIConversationAnswering } from '../Conversation/controller/types';
import {
  type AIMessageComposerStore,
  initialAIMessageComposerState as initialStoreState,
} from './store';

export type { AIMessageComposerStore } from './store';

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
            aria-label={t('aria/File upload')}
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

const AIMessageComposerContext = createContext<StateStore<AIMessageComposerStore>>(
  new StateStore<AIMessageComposerStore>(initialStoreState),
);

export const useAIMessageComposerContext = () => useContext(AIMessageComposerContext);

// The conversation the composer writes in, if it was given one.
const AIMessageComposerConversationContext = createContext<
  AIConversationController | undefined
>(undefined);

const statusSelector = ({ status }: AIConversationControllerState) => ({ status });

// Whether the agent of the composer's conversation is answering. `false` without a conversation.
const useIsAnswering = (conversation: AIConversationController | undefined) => {
  const { status } = useStateStore(conversation?.state, statusSelector) ?? {};
  return !!status && isAIConversationAnswering(status);
};

const isEditingSelector = (currentState: AIMessageComposerStore) => ({
  isEditing: !!currentState.isEditing,
});

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

/**
 * How the composer arranges its parts.
 *
 * - `stacked`: one part under another, such as the text above a row of `Actions`.
 * - `inline`: the text and the controls side by side on one line, the controls at the end of
 *   it as the text grows. The attachment previews keep a full-width row above them.
 */
export type AIMessageComposerLayout = 'stacked' | 'inline';

type AIMessageComposerProps = ComponentPropsWithoutRef<'form'> & {
  /**
   * The conversation the person writes in. The composer shows its `composer` store, and
   * submitting sends what the person wrote through it (`conversation.send`), unless `onSubmit`
   * calls `event.preventDefault()`. Meanwhile `SubmitButton` turns into a `StopButton`, and
   * while the person edits a message the composer says so, with a button that cancels it.
   */
  conversation?: AIConversationController;
  /**
   * How the composer arranges its parts: one under another, or the text and the controls on
   * one line, which suits a composer whose only control is the send button.
   *
   * @default 'stacked'
   */
  layout?: AIMessageComposerLayout;
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
  StopButton: typeof StopButton;
  Actions: typeof Actions;
  ModelSelect: typeof ModelSelect;
  AttachmentPreview: typeof AttachmentPreview;
  ChatOptions: typeof ChatOptions;
}

export const AIMessageComposer: AIMessageComposer = ({
  children,
  className,
  conversation,
  disabled,
  layout = 'stacked',
  nameMapping,
  onChange,
  onReset,
  onSubmit,
  resetAttachmentsOnSelect = true,
  ...restProps
}) => {
  const themeScopeClassName = useAIThemeScopeClassName();
  const [ownStore] = useState(
    () => new StateStore<AIMessageComposerStore>(initialStoreState),
  );
  const stateStore = conversation?.composer ?? ownStore;

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
    // a reset clears the draft but must not re-enable a composer disabled via props, and the
    // chat option stays picked
    stateStore.next((currentState) => ({
      ...initialStoreState,
      chatOption: currentState.chatOption,
      disabled,
    }));
  });

  const handleSubmit = useStableCallback((e: FormSubmitEvent) => {
    onSubmit?.(e);
    if (!conversation || e.defaultPrevented) return;
    e.preventDefault();
    // Enter while the agent answers doesn't send: the send button is a stop button meanwhile.
    if (isAIConversationAnswering(conversation.state.getLatestValue().status)) return;
    const { attachments, chatOption, custom, text } = stateStore.getLatestValue();
    if (text.trim() === '' && attachments.length === 0) return;
    conversation.send({
      attachments: attachments.map(({ file }) => file),
      chatOption: chatOption ?? undefined,
      custom,
      text,
    });
    stateStore.partialNext({ attachments: [], text: '' });
  });

  return (
    <ThemeScopeProvider>
      <AIMessageComposerContext.Provider value={stateStore}>
        <AIMessageComposerConversationContext.Provider value={conversation}>
          <form
            className={clsx(
              themeScopeClassName,
              'str-chat__ai-message-composer__form',
              layout === 'inline' && 'str-chat__ai-message-composer__form--inline',
              className,
            )}
            onChange={handleChange}
            onReset={handleReset}
            onSubmit={handleSubmit}
            {...restProps}
          >
            <EditingIndicator />
            {children}
          </form>
        </AIMessageComposerConversationContext.Provider>
      </AIMessageComposerContext.Provider>
    </ThemeScopeProvider>
  );
};

type FormSubmitEvent = Parameters<
  NonNullable<ComponentPropsWithoutRef<'form'>['onSubmit']>
>[0];

const noop = () => undefined;

/**
 * Says the person is editing a message they sent, with a button that cancels it, while the
 * composer's store says they are (`isEditing`).
 */
const EditingIndicator = () => {
  const store = useAIMessageComposerContext();
  const conversation = useContext(AIMessageComposerConversationContext);
  const { isEditing } = useStateStore(store, isEditingSelector);
  const { t } = useTranslationContext();
  const { IconEdit, IconXmarkSmall } = useComponentContextIcons();
  if (!isEditing) return null;
  const cancel = () => {
    conversation?.cancelEditing();
    if (store.getLatestValue().isEditing)
      store.partialNext({ isEditing: false, text: '' });
  };
  return (
    <div className='str-chat__ai-message-composer__editing'>
      <span className='str-chat__ai-chat-options__chip'>
        <span className='str-chat__ai-chat-options__chip-icon'>
          <IconEdit />
        </span>
        <span className='str-chat__ai-chat-options__chip-title'>{t('Editing')}</span>
        <button
          aria-label={t('aria/Cancel editing')}
          className='str-chat__ai-chat-options__chip-remove'
          onClick={cancel}
          type='button'
        >
          <IconXmarkSmall />
        </button>
      </span>
    </div>
  );
};

const useHasMounted = () => {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);
  return hasMounted;
};

// A layout effect in the browser, and nothing on a server, which has no layout to measure.
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** The tallest the text input grows to, in pixels, before it scrolls. */
const TEXT_INPUT_MAX_HEIGHT = 200;

/** Makes a text input as tall as its lines, measured from one line so it shrinks again too. */
const fitToLines = (element: HTMLTextAreaElement) => {
  element.style.height = 'auto';
  element.style.height = `${Math.min(element.scrollHeight, TEXT_INPUT_MAX_HEIGHT)}px`;
};

/**
 * Where the message is written. It takes several lines and grows with them, up to a limit:
 * Enter sends, Shift+Enter starts a new line, and Enter while an input method is still composing
 * a character does neither.
 */
const TextInput = ({ onKeyDown, ...props }: ComponentPropsWithoutRef<'textarea'>) => {
  const { text } = useText();
  const { disabled } = useIsDisabled();
  const { t } = useTranslationContext();
  const ref = useRef<HTMLTextAreaElement>(null);
  const { isEditing } = useStateStore(useAIMessageComposerContext(), isEditingSelector);

  // Editing a message puts its text here: the person goes on writing at its end.
  useEffect(() => {
    const element = ref.current;
    if (!isEditing || !element) return;
    element.focus();
    element.setSelectionRange(element.value.length, element.value.length);
  }, [isEditing]);

  // Sized to its lines: each time the text changes, and each time its width does, which wraps
  // them differently (a resized window, or a composer first laid out while hidden).
  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (element) fitToLines(element);
  }, [text]);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    let width = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (element.clientWidth === width) return;
      width = element.clientWidth;
      fitToLines(element);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(event);
    if (
      event.defaultPrevented ||
      event.key !== 'Enter' ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  return (
    <textarea
      autoComplete='off'
      className='str-chat__ai-message-composer__text-input'
      name='message'
      // React requires onChange when value is set, defaultValue stops working
      // when input gets "dirty"
      // actual on-change is handled at the form level
      onChange={noop}
      placeholder={t('Ask a question...')}
      ref={ref}
      rows={1}
      value={text}
      {...props}
      disabled={disabled}
      onKeyDown={handleKeyDown}
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
      aria-label={t('aria/Start voice input')}
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

/**
 * Sends the message. In a composer with a `conversation`, a `StopButton` takes its place while
 * the agent answers.
 */
const SubmitButton = ({
  active,
  ...restProps
}: ComponentPropsWithoutRef<'button'> & { active?: boolean }) => {
  const { disabled } = useIsDisabled();
  const { t } = useTranslationContext();
  const { IconSend } = useComponentContextIcons();
  const conversation = useContext(AIMessageComposerConversationContext);
  const isAnswering = useIsAnswering(conversation);
  if (isAnswering) return <StopButton />;
  return (
    <button
      aria-label={t('aria/Send')}
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

/**
 * Stops a reply the agent is still writing: shown in place of the `SubmitButton` while one is.
 * Unlike the composer's other controls it does not follow the composer's `disabled`, since a
 * composer is often disabled exactly while a reply is being written, which is when it is needed.
 * In a composer with a `conversation` it stops the conversation's reply, unless `onClick` calls
 * `event.preventDefault()`.
 */
const StopButton = ({
  children,
  onClick,
  ...restProps
}: ComponentPropsWithoutRef<'button'>) => {
  const { t } = useTranslationContext();
  const { IconStopFill } = useComponentContextIcons();
  const conversation = useContext(AIMessageComposerConversationContext);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) conversation?.stop();
  };
  return (
    <button
      aria-label={t('aria/Stop AI Generation')}
      className='str-chat__ai-message-composer__round-button str-chat__ai-message-composer__round-button--stop'
      type='button'
      {...restProps}
      onClick={handleClick}
    >
      {children ?? <IconStopFill />}
    </button>
  );
};

/**
 * A row for the composer's controls, such as the file picker, dictation and the send button,
 * lined up at its end. In the `stacked` layout it goes under the text.
 */
const Actions = ({ className, ...restProps }: ComponentPropsWithoutRef<'div'>) => (
  <div
    className={clsx('str-chat__ai-message-composer__actions', className)}
    {...restProps}
  />
);

const chatOptionSelector = (currentState: AIMessageComposerStore) => ({
  chatOption: currentState.chatOption,
});

// Follows the composer's disabled state unless told otherwise, and keeps the picked option in
// the composer's store (`chatOption`), where a conversation finds it when the message is sent.
const ChatOptions = ({
  defaultSelectedId,
  onSelectedChange,
  options,
  selectedId,
  ...props
}: ChatOptionsProps) => {
  const store = useAIMessageComposerContext();
  const { disabled } = useIsDisabled();
  const { chatOption } = useStateStore(store, chatOptionSelector);
  // Picked before anything is: the default, or the controlled option, which the store takes.
  const isControlled = selectedId !== undefined;
  const seededId = isControlled ? selectedId : (defaultSelectedId ?? null);
  const shownId =
    isControlled || chatOption === undefined ? seededId : (chatOption?.id ?? null);
  useIsomorphicLayoutEffect(() => {
    const current = store.getLatestValue().chatOption;
    if (!isControlled && current !== undefined) return;
    const option = options.find((item) => item.id === seededId) ?? null;
    // By id: an app's options can be new objects on every render.
    if (current === undefined || (current?.id ?? null) !== (option?.id ?? null)) {
      store.partialNext({ chatOption: option });
    }
  }, [isControlled, options, seededId, store]);

  return (
    <ChatOptionsBase
      {...props}
      disabled={props.disabled ?? disabled}
      onSelectedChange={(option) => {
        if (!isControlled) store.partialNext({ chatOption: option });
        onSelectedChange?.(option);
      }}
      options={options}
      selectedId={isControlled ? selectedId : shownId}
    />
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
AIMessageComposer.StopButton = StopButton;
AIMessageComposer.Actions = Actions;
AIMessageComposer.ModelSelect = ModelSelect;
AIMessageComposer.AttachmentPreview = AttachmentPreview;
AIMessageComposer.ChatOptions = ChatOptions;
