import type { ReactNode, Ref } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Event } from 'stream-chat';
import {
  Dropdown,
  type DropdownTriggerProps,
  IconChevronDown,
  Prompt,
  useChatContext,
  useDialogIsOpen,
  useDialogOnNearestManager,
  useDropdownContext,
} from 'stream-chat-react';
import { DraggableDialog } from '../DraggableDialog';
import {
  buildFreshWebSocketEventPayload,
  createInitialSimulationState,
  emitWebSocketEventPayload,
} from './websocketEventAutomation';
import {
  getStoredSavedPipelines,
  hydrateSavedPipeline,
  persistSavedPipelines,
  serializePipelineForStorage,
} from './websocketEventPipelineStorage';

import {
  buildInitialWebSocketEventDrafts,
  buildWebSocketEventPresetDraft,
  buildWebSocketEventDraft,
  createWebSocketEventTemplateContext,
  readyWebsocketEventTypes,
  supportedWebsocketEventTypes,
  type SupportedWebsocketEventType,
  todoWebsocketEventTypes,
  websocketEventPresetOptions,
  websocketEventTemplateDefinitions,
  type WebSocketEventPresetId,
} from './websocketEventTemplates';
import type {
  DialogMode,
  EventPipeline,
  IntervalEmitter,
  PayloadMode,
  PipelineEmitStep,
  PipelineStep,
  SavedEventPipeline,
  SimulationState,
} from './types';

export const webSocketEventPromptDialogId = 'app-websocket-event-prompt-dialog';

const initialEventType: SupportedWebsocketEventType = 'message.new';
const defaultDialogMode: DialogMode = 'single';

const assignReferenceRef = (
  referenceRef: Ref<HTMLElement> | undefined,
  element: HTMLButtonElement | null,
) => {
  if (!referenceRef) return;

  if (typeof referenceRef === 'function') {
    referenceRef(element);
    return;
  }

  referenceRef.current = element;
};

const createPipelineEmitStep = ({
  eventType,
  id,
  payload,
  payloadMode = 'fresh',
}: {
  eventType: SupportedWebsocketEventType;
  id: string;
  payload: string;
  payloadMode?: PayloadMode;
}): PipelineEmitStep => ({
  emitCount: 0,
  eventType,
  id,
  kind: 'emit',
  lastEmittedAt: null,
  payload,
  payloadMode,
});

const createDefaultPipeline = ({
  createId,
  drafts,
}: {
  createId: (prefix: string) => string;
  drafts: Record<SupportedWebsocketEventType, string>;
}): EventPipeline => ({
  id: createId('pipeline'),
  loop: false,
  name: 'Message + reaction flow',
  steps: [
    createPipelineEmitStep({
      eventType: 'message.new',
      id: createId('pipeline-step'),
      payload: drafts['message.new'],
    }),
    {
      id: createId('pipeline-step'),
      kind: 'delay',
      ms: 1000,
    },
    createPipelineEmitStep({
      eventType: 'reaction.new',
      id: createId('pipeline-step'),
      payload: drafts['reaction.new'],
    }),
  ],
});

const createDefaultIntervalEmitters = ({
  createId,
  drafts,
}: {
  createId: (prefix: string) => string;
  drafts: Record<SupportedWebsocketEventType, string>;
}): IntervalEmitter[] => [
  {
    active: false,
    emitCount: 0,
    eventType: 'message.new',
    everyMs: 3000,
    id: createId('interval'),
    lastEmittedAt: null,
    name: 'Messages',
    payload: drafts['message.new'],
    payloadMode: 'fresh',
  },
  {
    active: false,
    emitCount: 0,
    eventType: 'reaction.new',
    everyMs: 5000,
    id: createId('interval'),
    lastEmittedAt: null,
    name: 'Reactions',
    payload: drafts['reaction.new'],
    payloadMode: 'fresh',
  },
];

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <div className='app__websocket-event-dialog__dropdown-section'>{children}</div>
);

const EventTypeDropdownItem = ({
  eventType,
  onSelect,
  selected,
}: {
  eventType: SupportedWebsocketEventType;
  onSelect: (eventType: SupportedWebsocketEventType) => void;
  selected: boolean;
}) => {
  const { close } = useDropdownContext();

  return (
    <button
      aria-checked={selected}
      className='app__websocket-event-dialog__dropdown-item'
      onClick={() => {
        onSelect(eventType);
        close();
      }}
      role='menuitemradio'
      type='button'
    >
      <span className='app__websocket-event-dialog__dropdown-item-label'>
        {eventType}
      </span>
      {!selected && 'todo' in websocketEventTemplateDefinitions[eventType] && (
        <span className='app__websocket-event-dialog__dropdown-item-badge'>TODO</span>
      )}
    </button>
  );
};

const EventPresetDropdownItem = ({
  onSelect,
  presetId,
  selected,
}: {
  onSelect: (presetId: WebSocketEventPresetId) => void;
  presetId: WebSocketEventPresetId;
  selected: boolean;
}) => {
  const { close } = useDropdownContext();
  const preset = websocketEventPresetOptions.find((option) => option.id === presetId);

  if (!preset) return null;

  return (
    <button
      aria-checked={selected}
      className='app__websocket-event-dialog__dropdown-item'
      onClick={() => {
        onSelect(presetId);
        close();
      }}
      role='menuitemradio'
      type='button'
    >
      <span className='app__websocket-event-dialog__dropdown-item-label'>
        {preset.label}
      </span>
    </button>
  );
};

const EventTypeDropdownItems = ({
  eventSearchQuery,
  onSearchChange,
  onSelectPreset,
  onSelect,
  selectedEventPresetId,
  selectedEventType,
}: {
  eventSearchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectPreset: (presetId: WebSocketEventPresetId) => void;
  onSelect: (eventType: SupportedWebsocketEventType) => void;
  selectedEventPresetId: WebSocketEventPresetId | null;
  selectedEventType: SupportedWebsocketEventType;
}) => {
  const normalizedQuery = eventSearchQuery.trim().toLowerCase();
  const filteredPresetOptions = websocketEventPresetOptions.filter((option) =>
    option.label.toLowerCase().includes(normalizedQuery),
  );
  const filteredReadyEventTypes = readyWebsocketEventTypes.filter((eventType) =>
    eventType.toLowerCase().includes(normalizedQuery),
  );
  const filteredTodoEventTypes = todoWebsocketEventTypes.filter((eventType) =>
    eventType.toLowerCase().includes(normalizedQuery),
  );
  const hasMatches =
    filteredPresetOptions.length > 0 ||
    filteredReadyEventTypes.length > 0 ||
    filteredTodoEventTypes.length > 0;

  return (
    <>
      <div
        className='app__websocket-event-dialog__dropdown-search'
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          className='app__websocket-event-dialog__dropdown-search-input'
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder='Search events'
          type='text'
          value={eventSearchQuery}
        />
      </div>
      {filteredPresetOptions.length > 0 && <SectionLabel>Presets</SectionLabel>}
      {filteredPresetOptions.map((preset) => (
        <EventPresetDropdownItem
          key={preset.id}
          onSelect={onSelectPreset}
          presetId={preset.id}
          selected={selectedEventPresetId === preset.id}
        />
      ))}
      {filteredReadyEventTypes.length > 0 && <SectionLabel>Ready</SectionLabel>}
      {filteredReadyEventTypes.map((eventType) => (
        <EventTypeDropdownItem
          eventType={eventType}
          key={eventType}
          onSelect={onSelect}
          selected={!selectedEventPresetId && selectedEventType === eventType}
        />
      ))}
      {filteredTodoEventTypes.length > 0 && (
        <SectionLabel>TODO placeholders</SectionLabel>
      )}
      {filteredTodoEventTypes.map((eventType) => (
        <EventTypeDropdownItem
          eventType={eventType}
          key={eventType}
          onSelect={onSelect}
          selected={selectedEventType === eventType}
        />
      ))}
      {!hasMatches && (
        <div className='app__websocket-event-dialog__dropdown-empty'>
          No matching events
        </div>
      )}
    </>
  );
};

const SavedPipelineDropdownItem = ({
  onSelect,
  savedPipeline,
  selected,
}: {
  onSelect: (savedPipelineId: string) => void;
  savedPipeline: SavedEventPipeline;
  selected: boolean;
}) => {
  const { close } = useDropdownContext();

  return (
    <button
      aria-checked={selected}
      className='app__websocket-event-dialog__dropdown-item'
      onClick={() => {
        onSelect(savedPipeline.id);
        close();
      }}
      role='menuitemradio'
      type='button'
    >
      <span className='app__websocket-event-dialog__dropdown-item-label'>
        {savedPipeline.name}
      </span>
      <span className='app__websocket-event-dialog__saved-pipeline-meta'>
        {new Date(savedPipeline.savedAt).toLocaleString()}
      </span>
    </button>
  );
};

const SavedPipelineDropdownItems = ({
  onSearchChange,
  onSelect,
  savedPipelineSearchQuery,
  savedPipelines,
  selectedSavedPipelineId,
}: {
  onSearchChange: (value: string) => void;
  onSelect: (savedPipelineId: string) => void;
  savedPipelineSearchQuery: string;
  savedPipelines: SavedEventPipeline[];
  selectedSavedPipelineId: string | null;
}) => {
  const normalizedQuery = savedPipelineSearchQuery.trim().toLowerCase();
  const filteredSavedPipelines = savedPipelines.filter((savedPipeline) =>
    savedPipeline.name.toLowerCase().includes(normalizedQuery),
  );

  return (
    <>
      <div
        className='app__websocket-event-dialog__dropdown-search'
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          className='app__websocket-event-dialog__dropdown-search-input'
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder='Search saved pipelines'
          type='text'
          value={savedPipelineSearchQuery}
        />
      </div>
      {filteredSavedPipelines.length > 0 && <SectionLabel>Saved pipelines</SectionLabel>}
      {filteredSavedPipelines.map((savedPipeline) => (
        <SavedPipelineDropdownItem
          key={savedPipeline.id}
          onSelect={onSelect}
          savedPipeline={savedPipeline}
          selected={selectedSavedPipelineId === savedPipeline.id}
        />
      ))}
      {filteredSavedPipelines.length === 0 && (
        <div className='app__websocket-event-dialog__dropdown-empty'>
          {savedPipelines.length === 0
            ? 'No saved pipelines'
            : 'No matching saved pipelines'}
        </div>
      )}
    </>
  );
};

const ModeTabButton = ({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) => (
  <button
    aria-selected={active}
    className='app__websocket-event-dialog__mode-tab'
    onClick={onClick}
    role='tab'
    type='button'
  >
    {children}
  </button>
);

type SearchableSelectOption<T extends string> = {
  label: string;
  value: T;
};

const SearchableSelectOptionItem = <T extends string>({
  onSelect,
  option,
  selected,
}: {
  onSelect: (value: T) => void;
  option: SearchableSelectOption<T>;
  selected: boolean;
}) => {
  const { close } = useDropdownContext();

  return (
    <button
      aria-checked={selected}
      className='app__websocket-event-dialog__dropdown-item'
      onClick={() => {
        onSelect(option.value);
        close();
      }}
      role='menuitemradio'
      type='button'
    >
      <span className='app__websocket-event-dialog__dropdown-item-label'>
        {option.label}
      </span>
    </button>
  );
};

const SearchableSelectDropdownItems = <T extends string>({
  onSearchChange,
  onSelect,
  options,
  searchPlaceholder,
  searchQuery,
  selectedValue,
}: {
  onSearchChange: (value: string) => void;
  onSelect: (value: T) => void;
  options: SearchableSelectOption<T>[];
  searchPlaceholder: string;
  searchQuery: string;
  selectedValue: T;
}) => {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(normalizedQuery),
  );

  return (
    <>
      <div
        className='app__websocket-event-dialog__dropdown-search'
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          className='app__websocket-event-dialog__dropdown-search-input'
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          type='text'
          value={searchQuery}
        />
      </div>
      {filteredOptions.map((option) => (
        <SearchableSelectOptionItem
          key={option.value}
          onSelect={onSelect}
          option={option}
          selected={selectedValue === option.value}
        />
      ))}
      {filteredOptions.length === 0 && (
        <div className='app__websocket-event-dialog__dropdown-empty'>
          No matching options
        </div>
      )}
    </>
  );
};

const SearchableSelect = <T extends string>({
  onChange,
  options,
  searchPlaceholder,
  value,
}: {
  onChange: (value: T) => void;
  options: SearchableSelectOption<T>[];
  searchPlaceholder: string;
  value: T;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0] ?? null;

  const TriggerComponent = useMemo(
    () =>
      function SearchableSelectTrigger({
        onClick,
        referenceRef,
        ...props
      }: DropdownTriggerProps) {
        return (
          <button
            {...props}
            className='app__websocket-event-dialog__select app__websocket-event-dialog__select-trigger'
            onClick={onClick}
            ref={(element) => assignReferenceRef(referenceRef, element)}
            type='button'
          >
            <span className='app__websocket-event-dialog__trigger-value'>
              {selectedOption?.label ?? ''}
            </span>
            <span
              aria-hidden='true'
              className='app__websocket-event-dialog__trigger-icon'
            >
              <IconChevronDown />
            </span>
          </button>
        );
      },
    [selectedOption],
  );

  return (
    <Dropdown
      className='app__websocket-event-dialog__dropdown'
      matchReferenceWidth
      onClose={() => setSearchQuery('')}
      onOpen={() => setSearchQuery('')}
      placement='bottom-start'
      TriggerComponent={TriggerComponent}
    >
      <SearchableSelectDropdownItems
        onSearchChange={setSearchQuery}
        onSelect={onChange}
        options={options}
        searchPlaceholder={searchPlaceholder}
        searchQuery={searchQuery}
        selectedValue={value}
      />
    </Dropdown>
  );
};

const eventTypeOptions: SearchableSelectOption<SupportedWebsocketEventType>[] =
  supportedWebsocketEventTypes.map((value) => ({
    label: value,
    value,
  }));

const payloadModeOptions: SearchableSelectOption<PayloadMode>[] = [
  { label: 'Fixed payload', value: 'fixed' },
  { label: 'Fresh payload', value: 'fresh' },
];

const EventTypeSelect = ({
  eventType,
  onChange,
}: {
  eventType: SupportedWebsocketEventType;
  onChange: (eventType: SupportedWebsocketEventType) => void;
}) => (
  <SearchableSelect
    onChange={onChange}
    options={eventTypeOptions}
    searchPlaceholder='Search events'
    value={eventType}
  />
);

const PayloadModeSelect = ({
  onChange,
  payloadMode,
}: {
  onChange: (payloadMode: PayloadMode) => void;
  payloadMode: PayloadMode;
}) => (
  <SearchableSelect
    onChange={onChange}
    options={payloadModeOptions}
    searchPlaceholder='Search payload modes'
    value={payloadMode}
  />
);

const formatLastEmittedAt = (value: string | null) => {
  if (!value) return 'Never';
  return new Date(value).toLocaleTimeString();
};

export const WebSocketEventPromptDialog = ({
  referenceElement,
}: {
  referenceElement: HTMLElement | null;
}) => {
  const { channel, client } = useChatContext();
  const idCounterRef = useRef(0);
  const createId = useCallback((prefix: string) => {
    idCounterRef.current += 1;
    return `${prefix}-${idCounterRef.current}`;
  }, []);
  const [selectedEventType, setSelectedEventType] =
    useState<SupportedWebsocketEventType>(initialEventType);
  const [selectedEventPresetId, setSelectedEventPresetId] =
    useState<WebSocketEventPresetId | null>(null);
  const templateContext = useMemo(
    () => createWebSocketEventTemplateContext({ channel, client }),
    [channel, client],
  );
  const [eventDrafts, setEventDrafts] = useState<
    Record<SupportedWebsocketEventType, string>
  >(() => buildInitialWebSocketEventDrafts(templateContext));
  const [activeMode, setActiveMode] = useState<DialogMode>(defaultDialogMode);
  const [pipeline, setPipeline] = useState<EventPipeline>(() =>
    createDefaultPipeline({
      createId,
      drafts: buildInitialWebSocketEventDrafts(templateContext),
    }),
  );
  const [intervalEmitters, setIntervalEmitters] = useState<IntervalEmitter[]>(() =>
    createDefaultIntervalEmitters({
      createId,
      drafts: buildInitialWebSocketEventDrafts(templateContext),
    }),
  );
  const [savedPipelines, setSavedPipelines] = useState<SavedEventPipeline[]>(() =>
    getStoredSavedPipelines(),
  );
  const [selectedSavedPipelineId, setSelectedSavedPipelineId] = useState<string | null>(
    null,
  );
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [savedPipelineSearchQuery, setSavedPipelineSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const simulationStateRef = useRef<SimulationState>(
    createInitialSimulationState({ channel, templateContext }),
  );
  const intervalsListRef = useRef<HTMLDivElement | null>(null);
  const intervalHandlesRef = useRef<Map<string, number>>(new Map());
  const intervalEmittersRef = useRef(intervalEmitters);
  const pipelineRunIdRef = useRef(0);
  const [recentlyAddedIntervalId, setRecentlyAddedIntervalId] = useState<string | null>(
    null,
  );
  const { dialog, dialogManager } = useDialogOnNearestManager({
    id: webSocketEventPromptDialogId,
  });
  const dialogIsOpen = useDialogIsOpen(webSocketEventPromptDialogId, dialogManager?.id);

  useEffect(() => {
    intervalEmittersRef.current = intervalEmitters;
  }, [intervalEmitters]);

  useEffect(() => {
    if (!recentlyAddedIntervalId) return;

    const timeoutId = window.setTimeout(() => {
      setRecentlyAddedIntervalId(null);
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [recentlyAddedIntervalId]);

  const stopIntervalEmitter = useCallback((intervalId: string) => {
    const handle = intervalHandlesRef.current.get(intervalId);

    if (handle) {
      window.clearInterval(handle);
      intervalHandlesRef.current.delete(intervalId);
    }

    setIntervalEmitters((current) =>
      current.map((intervalEmitter) =>
        intervalEmitter.id === intervalId
          ? {
              ...intervalEmitter,
              active: false,
            }
          : intervalEmitter,
      ),
    );
  }, []);

  const stopAllIntervalEmitters = useCallback(() => {
    intervalHandlesRef.current.forEach((handle) => {
      window.clearInterval(handle);
    });
    intervalHandlesRef.current.clear();
    setIntervalEmitters((current) =>
      current.map((intervalEmitter) => ({
        ...intervalEmitter,
        active: false,
      })),
    );
  }, []);

  const cancelPipeline = useCallback(() => {
    pipelineRunIdRef.current += 1;
    setPipelineRunning(false);
  }, []);

  const resetState = useCallback(() => {
    const nextDrafts = buildInitialWebSocketEventDrafts(templateContext);
    stopAllIntervalEmitters();
    cancelPipeline();
    simulationStateRef.current = createInitialSimulationState({
      channel,
      templateContext,
    });
    setActiveMode(defaultDialogMode);
    setSelectedEventType(initialEventType);
    setSelectedEventPresetId(null);
    setEventDrafts(nextDrafts);
    setPipeline(
      createDefaultPipeline({
        createId,
        drafts: nextDrafts,
      }),
    );
    setSelectedSavedPipelineId(null);
    setIntervalEmitters(
      createDefaultIntervalEmitters({
        createId,
        drafts: nextDrafts,
      }),
    );
    setEventSearchQuery('');
    setSavedPipelineSearchQuery('');
    setErrorMessage(null);
  }, [cancelPipeline, channel, createId, stopAllIntervalEmitters, templateContext]);

  useEffect(() => {
    if (dialogIsOpen) return;
    resetState();
  }, [dialogIsOpen, resetState]);

  const closeDialog = useCallback(() => {
    dialog.close();
  }, [dialog]);

  useEffect(
    () => () => {
      stopAllIntervalEmitters();
      cancelPipeline();
    },
    [cancelPipeline, stopAllIntervalEmitters],
  );

  const currentDraft = eventDrafts[selectedEventType];
  const currentTemplateDefinition = websocketEventTemplateDefinitions[selectedEventType];
  const selectedEventPreset =
    websocketEventPresetOptions.find((option) => option.id === selectedEventPresetId) ??
    null;
  const selectedSavedPipeline =
    savedPipelines.find(
      (savedPipeline) => savedPipeline.id === selectedSavedPipelineId,
    ) ?? null;

  const updateSavedPipelines = useCallback(
    (updater: (current: SavedEventPipeline[]) => SavedEventPipeline[]) => {
      setSavedPipelines((current) => {
        const nextSavedPipelines = updater(current).sort((left, right) =>
          right.savedAt.localeCompare(left.savedAt),
        );
        persistSavedPipelines(nextSavedPipelines);
        return nextSavedPipelines;
      });
    },
    [],
  );

  const updateSelectedDraft = useCallback(
    (value: string) => {
      setEventDrafts((current) => ({
        ...current,
        [selectedEventType]: value,
      }));
    },
    [selectedEventType],
  );

  const parsePayloadInput = useCallback((payloadInput: string) => {
    const parsedPayload = JSON.parse(payloadInput) as unknown;

    if (
      !parsedPayload ||
      typeof parsedPayload !== 'object' ||
      Array.isArray(parsedPayload)
    ) {
      throw new Error('Payload must be a JSON object');
    }

    return parsedPayload as Partial<Event>;
  }, []);

  const emitConfiguredEvent = useCallback(
    ({
      eventType,
      payload,
      payloadMode,
      source,
    }: {
      eventType: SupportedWebsocketEventType;
      payload: string;
      payloadMode: PayloadMode;
      source:
        | { kind: 'single' }
        | { kind: 'pipeline'; stepId: string }
        | { kind: 'interval'; intervalId: string };
    }) => {
      try {
        const emittedPayload =
          payloadMode === 'fresh'
            ? buildFreshWebSocketEventPayload({
                eventType,
                simulationState: simulationStateRef.current,
                templateContext,
              })
            : parsePayloadInput(payload);

        const emittedEvent = emitWebSocketEventPayload({
          client,
          eventType,
          payload: emittedPayload,
          simulationState: simulationStateRef.current,
          templateContext,
        });
        const emittedPayloadString = JSON.stringify(emittedEvent, null, 2);
        const emittedAt = new Date().toISOString();

        if (source.kind === 'single') {
          setEventDrafts((current) => ({
            ...current,
            [eventType]: emittedPayloadString,
          }));
        }

        if (source.kind === 'pipeline') {
          setPipeline((current) => ({
            ...current,
            steps: current.steps.map((step) =>
              step.kind === 'emit' && step.id === source.stepId
                ? {
                    ...step,
                    emitCount: step.emitCount + 1,
                    lastEmittedAt: emittedAt,
                    payload: emittedPayloadString,
                  }
                : step,
            ),
          }));
        }

        if (source.kind === 'interval') {
          setIntervalEmitters((current) =>
            current.map((intervalEmitter) =>
              intervalEmitter.id === source.intervalId
                ? {
                    ...intervalEmitter,
                    emitCount: intervalEmitter.emitCount + 1,
                    lastEmittedAt: emittedAt,
                    payload: emittedPayloadString,
                  }
                : intervalEmitter,
            ),
          );
        }

        setErrorMessage(null);
        return true;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to emit event');
        return false;
      }
    },
    [client, parsePayloadInput, templateContext],
  );

  const handleResetPayload = useCallback(() => {
    updateSelectedDraft(
      selectedEventPresetId
        ? buildWebSocketEventPresetDraft(selectedEventPresetId, templateContext)
        : buildWebSocketEventDraft(selectedEventType, templateContext),
    );
    setErrorMessage(null);
  }, [selectedEventPresetId, selectedEventType, templateContext, updateSelectedDraft]);

  const handleTriggerEvent = useCallback(() => {
    emitConfiguredEvent({
      eventType: selectedEventType,
      payload: currentDraft,
      payloadMode: 'fixed',
      source: { kind: 'single' },
    });
  }, [currentDraft, emitConfiguredEvent, selectedEventType]);

  const insertPipelineStep = useCallback((insertAtIndex: number, step: PipelineStep) => {
    setPipeline((current) => {
      const nextSteps = [...current.steps];
      nextSteps.splice(insertAtIndex, 0, step);

      return {
        ...current,
        steps: nextSteps,
      };
    });
  }, []);

  const addPipelineEmitStep = useCallback(
    (insertAtIndex: number) => {
      insertPipelineStep(
        insertAtIndex,
        createPipelineEmitStep({
          eventType: selectedEventType,
          id: createId('pipeline-step'),
          payload: eventDrafts[selectedEventType],
        }),
      );
    },
    [createId, eventDrafts, insertPipelineStep, selectedEventType],
  );

  const addPipelineDelayStep = useCallback(
    (insertAtIndex: number) => {
      insertPipelineStep(insertAtIndex, {
        id: createId('pipeline-step'),
        kind: 'delay',
        ms: 1000,
      });
    },
    [createId, insertPipelineStep],
  );

  const movePipelineStep = useCallback((stepId: string, direction: -1 | 1) => {
    setPipeline((current) => {
      const index = current.steps.findIndex((step) => step.id === stepId);

      if (index === -1) return current;

      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.steps.length) {
        return current;
      }

      const nextSteps = [...current.steps];
      const [step] = nextSteps.splice(index, 1);

      if (!step) return current;

      nextSteps.splice(nextIndex, 0, step);

      return {
        ...current,
        steps: nextSteps,
      };
    });
  }, []);

  const removePipelineStep = useCallback((stepId: string) => {
    setPipeline((current) => ({
      ...current,
      steps: current.steps.filter((step) => step.id !== stepId),
    }));
  }, []);

  const updatePipelineStep = useCallback(
    (stepId: string, updater: (step: PipelineStep) => PipelineStep) => {
      setPipeline((current) => ({
        ...current,
        steps: current.steps.map((step) => (step.id === stepId ? updater(step) : step)),
      }));
    },
    [],
  );

  const runPipeline = useCallback(async () => {
    if (pipelineRunning || pipeline.steps.length === 0) return;

    const pipelineSnapshot = pipeline;
    const runId = pipelineRunIdRef.current + 1;
    pipelineRunIdRef.current = runId;
    setPipelineRunning(true);
    setErrorMessage(null);

    try {
      do {
        for (const step of pipelineSnapshot.steps) {
          if (pipelineRunIdRef.current !== runId) {
            return;
          }

          if (step.kind === 'delay') {
            await new Promise<void>((resolve) => {
              window.setTimeout(resolve, step.ms);
            });
            continue;
          }

          const succeeded = emitConfiguredEvent({
            eventType: step.eventType,
            payload: step.payload,
            payloadMode: step.payloadMode,
            source: {
              kind: 'pipeline',
              stepId: step.id,
            },
          });

          if (!succeeded) {
            return;
          }
        }
      } while (pipelineSnapshot.loop && pipelineRunIdRef.current === runId);
    } finally {
      if (pipelineRunIdRef.current === runId) {
        setPipelineRunning(false);
      }
    }
  }, [emitConfiguredEvent, pipeline, pipelineRunning]);

  const loadSavedPipeline = useCallback(
    (savedPipelineId: string) => {
      const savedPipeline = savedPipelines.find((item) => item.id === savedPipelineId);

      if (!savedPipeline) return;

      cancelPipeline();
      setPipeline(
        hydrateSavedPipeline({
          createId,
          savedPipeline,
        }),
      );
      setSelectedSavedPipelineId(savedPipeline.id);
      setSavedPipelineSearchQuery('');
      setErrorMessage(null);
    },
    [cancelPipeline, createId, savedPipelines],
  );

  const saveCurrentPipeline = useCallback(() => {
    const normalizedName = pipeline.name.trim();

    if (!normalizedName) {
      setErrorMessage('Pipeline name is required');
      return;
    }

    const existingSavedPipeline = savedPipelines.find(
      (savedPipeline) =>
        savedPipeline.name.trim().toLowerCase() === normalizedName.toLowerCase(),
    );
    const savedPipelineId =
      selectedSavedPipelineId ?? existingSavedPipeline?.id ?? createId('saved-pipeline');
    const savedPipeline = serializePipelineForStorage({
      pipeline: {
        ...pipeline,
        name: normalizedName,
      },
      savedPipelineId,
    });

    updateSavedPipelines((current) => [
      savedPipeline,
      ...current.filter((item) => item.id !== savedPipeline.id),
    ]);
    setPipeline((current) => ({
      ...current,
      name: normalizedName,
    }));
    setSelectedSavedPipelineId(savedPipeline.id);
    setErrorMessage(null);
  }, [createId, pipeline, savedPipelines, selectedSavedPipelineId, updateSavedPipelines]);

  const deleteSavedPipeline = useCallback(
    (savedPipelineId?: string) => {
      const resolvedSavedPipelineId = savedPipelineId ?? selectedSavedPipelineId;

      if (!resolvedSavedPipelineId) return;

      updateSavedPipelines((current) =>
        current.filter((savedPipeline) => savedPipeline.id !== resolvedSavedPipelineId),
      );

      if (selectedSavedPipelineId === resolvedSavedPipelineId) {
        setSelectedSavedPipelineId(null);
      }

      setErrorMessage(null);
    },
    [selectedSavedPipelineId, updateSavedPipelines],
  );

  const addIntervalEmitter = useCallback(() => {
    const intervalId = createId('interval');

    setIntervalEmitters((current) => [
      {
        active: false,
        emitCount: 0,
        eventType: selectedEventType,
        everyMs: 4000,
        id: intervalId,
        lastEmittedAt: null,
        name: `Emitter ${current.length + 1}`,
        payload: eventDrafts[selectedEventType],
        payloadMode: 'fresh',
      },
      ...current,
    ]);
    setRecentlyAddedIntervalId(intervalId);
    intervalsListRef.current?.scrollTo({ top: 0 });
  }, [createId, eventDrafts, selectedEventType]);

  const updateIntervalEmitter = useCallback(
    (
      intervalId: string,
      updater: (intervalEmitter: IntervalEmitter) => IntervalEmitter,
    ) => {
      setIntervalEmitters((current) =>
        current.map((intervalEmitter) =>
          intervalEmitter.id === intervalId ? updater(intervalEmitter) : intervalEmitter,
        ),
      );
    },
    [],
  );

  const removeIntervalEmitter = useCallback(
    (intervalId: string) => {
      stopIntervalEmitter(intervalId);
      setIntervalEmitters((current) =>
        current.filter((intervalEmitter) => intervalEmitter.id !== intervalId),
      );
    },
    [stopIntervalEmitter],
  );

  const startIntervalEmitter = useCallback(
    (intervalId: string) => {
      if (intervalHandlesRef.current.has(intervalId)) return;

      const intervalEmitter = intervalEmittersRef.current.find(
        (currentIntervalEmitter) => currentIntervalEmitter.id === intervalId,
      );

      if (!intervalEmitter) return;

      const emitOnce = () => {
        const latestIntervalEmitter = intervalEmittersRef.current.find(
          (currentIntervalEmitter) => currentIntervalEmitter.id === intervalId,
        );

        if (!latestIntervalEmitter) return;

        const succeeded = emitConfiguredEvent({
          eventType: latestIntervalEmitter.eventType,
          payload: latestIntervalEmitter.payload,
          payloadMode: latestIntervalEmitter.payloadMode,
          source: {
            kind: 'interval',
            intervalId,
          },
        });

        if (!succeeded) {
          stopIntervalEmitter(intervalId);
        }
      };

      emitOnce();
      const handle = window.setInterval(emitOnce, intervalEmitter.everyMs);

      intervalHandlesRef.current.set(intervalId, handle);
      setIntervalEmitters((current) =>
        current.map((currentIntervalEmitter) =>
          currentIntervalEmitter.id === intervalId
            ? {
                ...currentIntervalEmitter,
                active: true,
              }
            : currentIntervalEmitter,
        ),
      );
    },
    [emitConfiguredEvent, stopIntervalEmitter],
  );

  const startAllIntervalEmitters = useCallback(() => {
    intervalEmittersRef.current.forEach((intervalEmitter) => {
      if (!intervalEmitter.active) {
        startIntervalEmitter(intervalEmitter.id);
      }
    });
  }, [startIntervalEmitter]);

  const EventTypeTrigger = useMemo(
    () =>
      function EventTypeTriggerComponent({
        onClick,
        referenceRef,
        ...props
      }: DropdownTriggerProps) {
        return (
          <button
            {...props}
            className='app__websocket-event-dialog__trigger'
            onClick={onClick}
            ref={(element) => assignReferenceRef(referenceRef, element)}
            type='button'
          >
            <span className='app__websocket-event-dialog__trigger-value'>
              {selectedEventPreset?.label ?? selectedEventType}
            </span>
            <span
              aria-hidden='true'
              className='app__websocket-event-dialog__trigger-icon'
            >
              <IconChevronDown />
            </span>
          </button>
        );
      },
    [selectedEventPreset, selectedEventType],
  );

  const SavedPipelineTrigger = useMemo(
    () =>
      function SavedPipelineTriggerComponent({
        onClick,
        referenceRef,
        ...props
      }: DropdownTriggerProps) {
        return (
          <button
            {...props}
            className='app__websocket-event-dialog__trigger'
            onClick={onClick}
            ref={(element) => assignReferenceRef(referenceRef, element)}
            type='button'
          >
            <span className='app__websocket-event-dialog__trigger-value'>
              {selectedSavedPipeline?.name ?? 'Load saved pipeline'}
            </span>
            <span
              aria-hidden='true'
              className='app__websocket-event-dialog__trigger-icon'
            >
              <IconChevronDown />
            </span>
          </button>
        );
      },
    [selectedSavedPipeline],
  );

  const renderPayloadTextarea = ({
    onChange,
    payload,
    payloadMode,
    rows = 10,
  }: {
    onChange: (value: string) => void;
    payload: string;
    payloadMode: PayloadMode;
    rows?: number;
  }) => (
    <textarea
      className='app__websocket-event-dialog__textarea'
      onChange={(event) => onChange(event.target.value)}
      readOnly={payloadMode === 'fresh'}
      rows={rows}
      spellCheck={false}
      value={payload}
    />
  );

  return (
    <DraggableDialog
      dialogClassName='app__websocket-event-dialog'
      dialogId={webSocketEventPromptDialogId}
      dialogIsOpen={dialogIsOpen}
      dialogManagerId={dialogManager?.id}
      dragHandleClassName='app__websocket-event-dialog__drag-handle'
      onClose={closeDialog}
      promptClassName='app__websocket-event-dialog__prompt'
      referenceElement={referenceElement}
      shellClassName='app__websocket-event-dialog__shell'
      title='Trigger WS Event'
    >
      <Prompt.Body className='app__websocket-event-dialog__body'>
        <div className='app__websocket-event-dialog__mode-tabs' role='tablist'>
          <ModeTabButton
            active={activeMode === 'single'}
            onClick={() => setActiveMode('single')}
          >
            Single Event
          </ModeTabButton>
          <ModeTabButton
            active={activeMode === 'pipeline'}
            onClick={() => setActiveMode('pipeline')}
          >
            Pipeline
          </ModeTabButton>
          <ModeTabButton
            active={activeMode === 'intervals'}
            onClick={() => setActiveMode('intervals')}
          >
            Intervals
          </ModeTabButton>
        </div>
        <div className='app__websocket-event-dialog__body-scroll'>
          {activeMode === 'single' && (
            <>
              <div className='app__websocket-event-dialog__meta'>
                <p className='app__websocket-event-dialog__note'>
                  Single Event emits one event immediately using the payload shown below.
                </p>
              </div>
              <div className='app__websocket-event-dialog__field'>
                <span className='app__websocket-event-dialog__field-label'>
                  Event type
                </span>
                <Dropdown
                  className='app__websocket-event-dialog__dropdown'
                  matchReferenceWidth
                  onClose={() => setEventSearchQuery('')}
                  onOpen={() => setEventSearchQuery('')}
                  placement='bottom-start'
                  TriggerComponent={EventTypeTrigger}
                >
                  <EventTypeDropdownItems
                    eventSearchQuery={eventSearchQuery}
                    onSearchChange={setEventSearchQuery}
                    onSelectPreset={(presetId) => {
                      const preset = websocketEventPresetOptions.find(
                        (option) => option.id === presetId,
                      );

                      if (!preset) return;

                      setSelectedEventType(preset.eventType);
                      setSelectedEventPresetId(presetId);
                      setEventDrafts((current) => ({
                        ...current,
                        [preset.eventType]: buildWebSocketEventPresetDraft(
                          presetId,
                          templateContext,
                        ),
                      }));
                      setErrorMessage(null);
                    }}
                    onSelect={(eventType) => {
                      setSelectedEventType(eventType);
                      setSelectedEventPresetId(null);
                      setErrorMessage(null);
                    }}
                    selectedEventPresetId={selectedEventPresetId}
                    selectedEventType={selectedEventType}
                  />
                </Dropdown>
              </div>
              <div className='app__websocket-event-dialog__meta'>
                <p className='app__websocket-event-dialog__description'>
                  {selectedEventPreset?.description ??
                    currentTemplateDefinition.description}
                </p>
                {'todo' in currentTemplateDefinition && (
                  <p className='app__websocket-event-dialog__todo'>
                    {currentTemplateDefinition.todo}
                  </p>
                )}
                <p className='app__websocket-event-dialog__note'>
                  Most event templates assume there is an active channel selected in the
                  preview.
                </p>
              </div>
              <label className='app__websocket-event-dialog__field'>
                <span className='app__websocket-event-dialog__field-label'>
                  Payload JSON
                </span>
                {renderPayloadTextarea({
                  onChange: (value) => {
                    updateSelectedDraft(value);
                    if (errorMessage) setErrorMessage(null);
                  },
                  payload: currentDraft,
                  payloadMode: 'fixed',
                  rows: 16,
                })}
              </label>
            </>
          )}

          {activeMode === 'pipeline' && (
            <div className='app__websocket-event-dialog__panel'>
              <div className='app__websocket-event-dialog__inline-fields'>
                <label className='app__websocket-event-dialog__field'>
                  <span className='app__websocket-event-dialog__field-label'>
                    Saved pipelines
                  </span>
                  <Dropdown
                    className='app__websocket-event-dialog__dropdown'
                    matchReferenceWidth
                    onClose={() => setSavedPipelineSearchQuery('')}
                    onOpen={() => setSavedPipelineSearchQuery('')}
                    placement='bottom-start'
                    TriggerComponent={SavedPipelineTrigger}
                  >
                    <SavedPipelineDropdownItems
                      onSearchChange={setSavedPipelineSearchQuery}
                      onSelect={loadSavedPipeline}
                      savedPipelineSearchQuery={savedPipelineSearchQuery}
                      savedPipelines={savedPipelines}
                      selectedSavedPipelineId={selectedSavedPipelineId}
                    />
                  </Dropdown>
                </label>
                <div className='app__websocket-event-dialog__saved-pipeline-actions'>
                  <button
                    className='app__websocket-event-dialog__action-button'
                    onClick={saveCurrentPipeline}
                    type='button'
                  >
                    Save current
                  </button>
                  <button
                    className='app__websocket-event-dialog__action-button app__websocket-event-dialog__action-button--danger'
                    disabled={!selectedSavedPipeline}
                    onClick={() => deleteSavedPipeline()}
                    type='button'
                  >
                    Delete saved
                  </button>
                </div>
              </div>

              <div className='app__websocket-event-dialog__inline-fields'>
                <label className='app__websocket-event-dialog__field'>
                  <span className='app__websocket-event-dialog__field-label'>
                    Pipeline name
                  </span>
                  <input
                    className='app__websocket-event-dialog__text-input'
                    onChange={(event) =>
                      setPipeline((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    type='text'
                    value={pipeline.name}
                  />
                </label>
                <label className='app__websocket-event-dialog__checkbox-label'>
                  <input
                    checked={pipeline.loop}
                    onChange={(event) =>
                      setPipeline((current) => ({
                        ...current,
                        loop: event.target.checked,
                      }))
                    }
                    type='checkbox'
                  />
                  Loop pipeline
                </label>
              </div>

              <div className='app__websocket-event-dialog__meta'>
                <p className='app__websocket-event-dialog__note'>
                  Pipeline runs one ordered script of emits and delays. When Loop pipeline
                  is enabled, the whole script restarts from the first step after the last
                  step finishes. Payload mode controls how each emit step builds its
                  event: Fixed payload uses the JSON currently shown in the editor, while
                  Fresh payload regenerates semantically valid data on every emit.
                </p>
              </div>

              <div className='app__websocket-event-dialog__stack'>
                {pipeline.steps.length === 0 && (
                  <div className='app__websocket-event-dialog__toolbar app__websocket-event-dialog__pipeline-insert-controls'>
                    <button
                      className='app__websocket-event-dialog__action-button'
                      onClick={() => addPipelineEmitStep(0)}
                      type='button'
                    >
                      Add emit step
                    </button>
                    <button
                      className='app__websocket-event-dialog__action-button'
                      onClick={() => addPipelineDelayStep(0)}
                      type='button'
                    >
                      Add delay
                    </button>
                  </div>
                )}
                {pipeline.steps.map((step, index) => (
                  <div className='app__websocket-event-dialog__stack' key={step.id}>
                    <div className='app__websocket-event-dialog__automation-card'>
                      <div className='app__websocket-event-dialog__automation-card-header'>
                        <div className='app__websocket-event-dialog__automation-card-title'>
                          <span className='app__websocket-event-dialog__automation-kind'>
                            {step.kind === 'emit' ? 'Emit' : 'Delay'}
                          </span>
                          <span>Step {index + 1}</span>
                          {step.kind === 'emit' && (
                            <span className='app__websocket-event-dialog__automation-summary'>
                              {step.emitCount} emits, last{' '}
                              {formatLastEmittedAt(step.lastEmittedAt)}
                            </span>
                          )}
                        </div>
                        <div className='app__websocket-event-dialog__automation-card-controls'>
                          <button
                            className='app__websocket-event-dialog__mini-button'
                            disabled={index === 0}
                            onClick={() => movePipelineStep(step.id, -1)}
                            type='button'
                          >
                            Up
                          </button>
                          <button
                            className='app__websocket-event-dialog__mini-button'
                            disabled={index === pipeline.steps.length - 1}
                            onClick={() => movePipelineStep(step.id, 1)}
                            type='button'
                          >
                            Down
                          </button>
                          <button
                            className='app__websocket-event-dialog__mini-button app__websocket-event-dialog__mini-button--danger'
                            onClick={() => removePipelineStep(step.id)}
                            type='button'
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {step.kind === 'emit' ? (
                        <div className='app__websocket-event-dialog__stack'>
                          <div className='app__websocket-event-dialog__inline-fields'>
                            <label className='app__websocket-event-dialog__field'>
                              <span className='app__websocket-event-dialog__field-label'>
                                Event type
                              </span>
                              <EventTypeSelect
                                eventType={step.eventType}
                                onChange={(eventType) =>
                                  updatePipelineStep(step.id, (currentStep) =>
                                    currentStep.kind === 'emit'
                                      ? {
                                          ...currentStep,
                                          eventType,
                                          payload: eventDrafts[eventType],
                                        }
                                      : currentStep,
                                  )
                                }
                              />
                            </label>
                            <label className='app__websocket-event-dialog__field'>
                              <span className='app__websocket-event-dialog__field-label'>
                                Payload mode
                              </span>
                              <PayloadModeSelect
                                onChange={(payloadMode) =>
                                  updatePipelineStep(step.id, (currentStep) =>
                                    currentStep.kind === 'emit'
                                      ? {
                                          ...currentStep,
                                          payloadMode,
                                        }
                                      : currentStep,
                                  )
                                }
                                payloadMode={step.payloadMode}
                              />
                            </label>
                          </div>
                          <label className='app__websocket-event-dialog__field'>
                            <span className='app__websocket-event-dialog__field-label'>
                              {step.payloadMode === 'fresh'
                                ? 'Latest generated payload preview'
                                : 'Payload JSON'}
                            </span>
                            {renderPayloadTextarea({
                              onChange: (value) =>
                                updatePipelineStep(step.id, (currentStep) =>
                                  currentStep.kind === 'emit'
                                    ? {
                                        ...currentStep,
                                        payload: value,
                                      }
                                    : currentStep,
                                ),
                              payload: step.payload,
                              payloadMode: step.payloadMode,
                            })}
                          </label>
                        </div>
                      ) : (
                        <label className='app__websocket-event-dialog__field'>
                          <span className='app__websocket-event-dialog__field-label'>
                            Delay (ms)
                          </span>
                          <input
                            className='app__websocket-event-dialog__number-input'
                            min={0}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              updatePipelineStep(step.id, (currentStep) =>
                                currentStep.kind === 'delay'
                                  ? {
                                      ...currentStep,
                                      ms: Number.isFinite(value) ? Math.max(value, 0) : 0,
                                    }
                                  : currentStep,
                              );
                            }}
                            type='number'
                            value={step.ms}
                          />
                        </label>
                      )}
                    </div>
                    <div className='app__websocket-event-dialog__toolbar app__websocket-event-dialog__pipeline-insert-controls'>
                      <button
                        className='app__websocket-event-dialog__action-button'
                        onClick={() => addPipelineEmitStep(index + 1)}
                        type='button'
                      >
                        Add emit step
                      </button>
                      <button
                        className='app__websocket-event-dialog__action-button'
                        onClick={() => addPipelineDelayStep(index + 1)}
                        type='button'
                      >
                        Add delay
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMode === 'intervals' && (
            <div className='app__websocket-event-dialog__panel app__websocket-event-dialog__intervals-panel'>
              <div className='app__websocket-event-dialog__toolbar'>
                <button
                  className='app__websocket-event-dialog__action-button'
                  onClick={addIntervalEmitter}
                  type='button'
                >
                  Add interval
                </button>
              </div>

              <div
                className='app__websocket-event-dialog__stack app__websocket-event-dialog__intervals-list'
                ref={intervalsListRef}
              >
                <div className='app__websocket-event-dialog__meta'>
                  <p className='app__websocket-event-dialog__note'>
                    Intervals run independent emitters in parallel, each on its own timer.
                    Use this for concurrent background traffic rather than a single
                    ordered sequence. Payload mode controls how each interval tick builds
                    its event: Fixed payload reuses the configured JSON, while Fresh
                    payload regenerates data every tick so messages and reactions stay
                    semantically coherent.
                  </p>
                </div>
                {intervalEmitters.map((intervalEmitter) => (
                  <div
                    className={
                      intervalEmitter.id === recentlyAddedIntervalId
                        ? 'app__websocket-event-dialog__automation-card app__websocket-event-dialog__automation-card--new'
                        : 'app__websocket-event-dialog__automation-card'
                    }
                    key={intervalEmitter.id}
                  >
                    <div className='app__websocket-event-dialog__automation-card-header'>
                      <div className='app__websocket-event-dialog__automation-card-title'>
                        <span
                          className={
                            intervalEmitter.active
                              ? 'app__websocket-event-dialog__automation-status app__websocket-event-dialog__automation-status--running'
                              : 'app__websocket-event-dialog__automation-status'
                          }
                        >
                          {intervalEmitter.active ? 'Running' : 'Idle'}
                        </span>
                        <span>{intervalEmitter.name || 'Unnamed interval'}</span>
                        <span className='app__websocket-event-dialog__automation-summary'>
                          {intervalEmitter.emitCount} emits, last{' '}
                          {formatLastEmittedAt(intervalEmitter.lastEmittedAt)}
                        </span>
                      </div>
                      <div className='app__websocket-event-dialog__automation-card-controls'>
                        {intervalEmitter.active ? (
                          <button
                            className='app__websocket-event-dialog__mini-button app__websocket-event-dialog__mini-button--danger'
                            onClick={() => stopIntervalEmitter(intervalEmitter.id)}
                            type='button'
                          >
                            Stop
                          </button>
                        ) : (
                          <button
                            className='app__websocket-event-dialog__mini-button app__websocket-event-dialog__mini-button--primary'
                            onClick={() => startIntervalEmitter(intervalEmitter.id)}
                            type='button'
                          >
                            Start
                          </button>
                        )}
                        <button
                          className='app__websocket-event-dialog__mini-button app__websocket-event-dialog__mini-button--danger'
                          onClick={() => removeIntervalEmitter(intervalEmitter.id)}
                          type='button'
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className='app__websocket-event-dialog__stack'>
                      <div className='app__websocket-event-dialog__inline-fields'>
                        <label className='app__websocket-event-dialog__field'>
                          <span className='app__websocket-event-dialog__field-label'>
                            Name
                          </span>
                          <input
                            className='app__websocket-event-dialog__text-input'
                            onChange={(event) =>
                              updateIntervalEmitter(
                                intervalEmitter.id,
                                (currentInterval) => ({
                                  ...currentInterval,
                                  name: event.target.value,
                                }),
                              )
                            }
                            type='text'
                            value={intervalEmitter.name}
                          />
                        </label>
                        <label className='app__websocket-event-dialog__field'>
                          <span className='app__websocket-event-dialog__field-label'>
                            Every (ms)
                          </span>
                          <input
                            className='app__websocket-event-dialog__number-input'
                            min={100}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              updateIntervalEmitter(
                                intervalEmitter.id,
                                (currentInterval) => ({
                                  ...currentInterval,
                                  everyMs: Number.isFinite(value)
                                    ? Math.max(value, 100)
                                    : 100,
                                }),
                              );
                            }}
                            type='number'
                            value={intervalEmitter.everyMs}
                          />
                        </label>
                      </div>

                      <div className='app__websocket-event-dialog__inline-fields'>
                        <label className='app__websocket-event-dialog__field'>
                          <span className='app__websocket-event-dialog__field-label'>
                            Event type
                          </span>
                          <EventTypeSelect
                            eventType={intervalEmitter.eventType}
                            onChange={(eventType) =>
                              updateIntervalEmitter(
                                intervalEmitter.id,
                                (currentInterval) => ({
                                  ...currentInterval,
                                  eventType,
                                  payload: eventDrafts[eventType],
                                }),
                              )
                            }
                          />
                        </label>
                        <label className='app__websocket-event-dialog__field'>
                          <span className='app__websocket-event-dialog__field-label'>
                            Payload mode
                          </span>
                          <PayloadModeSelect
                            onChange={(payloadMode) =>
                              updateIntervalEmitter(
                                intervalEmitter.id,
                                (currentInterval) => ({
                                  ...currentInterval,
                                  payloadMode,
                                }),
                              )
                            }
                            payloadMode={intervalEmitter.payloadMode}
                          />
                        </label>
                      </div>

                      <label className='app__websocket-event-dialog__field'>
                        <span className='app__websocket-event-dialog__field-label'>
                          {intervalEmitter.payloadMode === 'fresh'
                            ? 'Latest generated payload preview'
                            : 'Payload JSON'}
                        </span>
                        {renderPayloadTextarea({
                          onChange: (value) =>
                            updateIntervalEmitter(
                              intervalEmitter.id,
                              (currentInterval) => ({
                                ...currentInterval,
                                payload: value,
                              }),
                            ),
                          payload: intervalEmitter.payload,
                          payloadMode: intervalEmitter.payloadMode,
                        })}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className='app__websocket-event-dialog__error' role='alert'>
              {errorMessage}
            </div>
          )}
        </div>
      </Prompt.Body>
      <Prompt.Footer className='app__websocket-event-dialog__footer'>
        <Prompt.FooterControls className='app__websocket-event-dialog__footer-controls'>
          {activeMode === 'single' ? (
            <>
              <Prompt.FooterControlsButtonSecondary onClick={handleResetPayload}>
                Reset payload
              </Prompt.FooterControlsButtonSecondary>
              <Prompt.FooterControlsButtonPrimary onClick={handleTriggerEvent}>
                Trigger event
              </Prompt.FooterControlsButtonPrimary>
            </>
          ) : activeMode === 'pipeline' ? (
            <>
              <Prompt.FooterControlsButtonSecondary onClick={closeDialog}>
                Close
              </Prompt.FooterControlsButtonSecondary>
              {pipelineRunning ? (
                <Prompt.FooterControlsButtonPrimary onClick={cancelPipeline}>
                  Stop pipeline
                </Prompt.FooterControlsButtonPrimary>
              ) : (
                <Prompt.FooterControlsButtonPrimary
                  onClick={() => {
                    void runPipeline();
                  }}
                >
                  Run pipeline
                </Prompt.FooterControlsButtonPrimary>
              )}
            </>
          ) : activeMode === 'intervals' ? (
            <>
              <Prompt.FooterControlsButtonSecondary onClick={closeDialog}>
                Close
              </Prompt.FooterControlsButtonSecondary>
              <Prompt.FooterControlsButtonSecondary onClick={stopAllIntervalEmitters}>
                Stop all
              </Prompt.FooterControlsButtonSecondary>
              <Prompt.FooterControlsButtonPrimary onClick={startAllIntervalEmitters}>
                Run all
              </Prompt.FooterControlsButtonPrimary>
            </>
          ) : (
            <Prompt.FooterControlsButtonSecondary onClick={closeDialog}>
              Close
            </Prompt.FooterControlsButtonSecondary>
          )}
        </Prompt.FooterControls>
      </Prompt.Footer>
    </DraggableDialog>
  );
};
