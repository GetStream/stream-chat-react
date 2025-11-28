import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { customAlphabet } from 'nanoid';
import { StateStore } from '@stream-io/state-store';
import { useStateStore } from '@stream-io/state-store/react-bindings';

import { FilePreview } from './file-preview';
import { useSpeechToText } from './use-speech-to-text';
import { useStableCallback } from '../../hooks/use-stable-callback';

const nanoId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 15);

const FileInput = () => {
  return (
    <FileInputBase>
      {({ id }) => (
        <>
          <input
            style={{ display: 'none' }}
            name="files"
            multiple
            type="file"
            id={id}
          />
          <label
            className="aicr__ai-message-composer__round-button"
            htmlFor={id}
            tabIndex={0}
          >
            <span className="material-symbols-rounded">add</span>
          </label>
        </>
      )}
    </FileInputBase>
  );
};

const FileInputBase = ({
  children,
}: {
  children?: ReactNode | (({ id }: { id: string }) => ReactNode);
}) => {
  const id = useMemo(() => `file-input-${nanoId()}`, []);

  return <>{typeof children === 'function' ? children({ id }) : children}</>;
};

FileInput.Base = FileInputBase;

export type AIMessageComposerStore = {
  attachments: {
    id: string;
    file: File;
    source: string | null;
    state: 'uploading' | 'uploaded' | 'failed' | 'pending';
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

  const selector = useCallback(
    (currentState: AIMessageComposerStore) => ({
      attachments: currentState.attachments,
    }),
    [],
  );

  const { attachments } = useStateStore(store, selector);

  return { attachments, removeAttachment };
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

export const AIMessageComposerBase = ({
  children,
  onChange,
  onReset,
  ...restProps
}: ComponentPropsWithoutRef<'form'>) => {
  const [stateStore] = useState(
    () => new StateStore<AIMessageComposerStore>(initialStoreState),
  );

  const handleChange = useStableCallback(
    (e: React.ChangeEvent<HTMLFormElement>) => {
      onChange?.(e);

      const inputElement = e.target as unknown as HTMLInputElement;

      const files = inputElement.name === 'files' ? inputElement.files : null;
      const text = inputElement.name === 'message' ? inputElement.value : null;

      stateStore.next((currentState) => {
        const newState = { ...currentState };

        if (files && files.length > 0) {
          const newFiles = Array.from(files).map(
            (file) =>
              ({
                id: nanoId(),
                file,
                source: null,
                state: 'pending' as const,
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

const Input = () => {
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
    />
  );
};

const SpeechToTextButton = () => {
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
    >
      <span className="material-symbols-rounded">mic</span>
    </button>
  );
};

export const AIMessageComposer = (
  props: Omit<ComponentProps<typeof AIMessageComposerBase>, 'children'>,
) => {
  return (
    <AIMessageComposerBase {...props}>
      <FilePreview />
      <Input />
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '.25rem', alignItems: 'center' }}>
          <FileInput />
          <SpeechToTextButton />
          <select
            className="aicr__ai-message-composer__select"
            name="model"
            defaultValue="gpt-4o"
          >
            <option value="gpt-5">GPT-5</option>
            <option value="gpt-4o">GPT-4o</option>
          </select>
          {/* <ToolsSelector /> */}
        </div>

        <button
          className="aicr__ai-message-composer__round-button"
          type="submit"
        >
          <span className="material-symbols-rounded">send</span>
        </button>
      </div>
    </AIMessageComposerBase>
  );
};

AIMessageComposer.Base = AIMessageComposerBase;
