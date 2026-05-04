import { supportedWebsocketEventTypes } from './websocketEventTemplates';
import type { EventPipeline, SavedEventPipeline, SavedPipelineStep } from './types';

const savedPipelinesStorageKey = 'stream-chat-react:vite:websocket-event-pipelines';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const isSupportedEventType = (
  value: unknown,
): value is (typeof supportedWebsocketEventTypes)[number] =>
  typeof value === 'string' &&
  supportedWebsocketEventTypes.includes(
    value as (typeof supportedWebsocketEventTypes)[number],
  );

const normalizeSavedPipelineStep = (value: unknown): SavedPipelineStep | undefined => {
  if (!isRecord(value) || value.kind === undefined) return;

  if (value.kind === 'delay') {
    if (typeof value.ms !== 'number' || !Number.isFinite(value.ms)) return;

    return {
      kind: 'delay',
      ms: Math.max(value.ms, 0),
    };
  }

  if (value.kind === 'emit') {
    if (!isSupportedEventType(value.eventType)) return;
    if (typeof value.payload !== 'string') return;
    if (value.payloadMode !== 'fixed' && value.payloadMode !== 'fresh') return;

    return {
      eventType: value.eventType,
      kind: 'emit',
      payload: value.payload,
      payloadMode: value.payloadMode,
    };
  }
};

const normalizeSavedPipeline = (value: unknown): SavedEventPipeline | undefined => {
  if (!isRecord(value)) return;
  if (typeof value.id !== 'string' || typeof value.name !== 'string') return;
  if (typeof value.savedAt !== 'string' || typeof value.loop !== 'boolean') return;
  if (!Array.isArray(value.steps)) return;

  const steps = value.steps
    .map(normalizeSavedPipelineStep)
    .filter((step): step is SavedPipelineStep => !!step);

  if (steps.length !== value.steps.length) return;

  return {
    id: value.id,
    loop: value.loop,
    name: value.name,
    savedAt: value.savedAt,
    steps,
  };
};

export const getStoredSavedPipelines = (): SavedEventPipeline[] => {
  if (typeof window === 'undefined') return [];

  try {
    const storedValue = window.localStorage.getItem(savedPipelinesStorageKey);

    if (!storedValue) return [];

    const parsedValue = JSON.parse(storedValue) as unknown;

    if (!Array.isArray(parsedValue)) return [];

    return parsedValue
      .map(normalizeSavedPipeline)
      .filter((pipeline): pipeline is SavedEventPipeline => !!pipeline);
  } catch {
    return [];
  }
};

export const persistSavedPipelines = (savedPipelines: SavedEventPipeline[]) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(savedPipelinesStorageKey, JSON.stringify(savedPipelines));
  } catch {
    // ignore persistence failures in environments where localStorage is unavailable
  }
};

export const serializePipelineForStorage = ({
  pipeline,
  savedPipelineId,
}: {
  pipeline: EventPipeline;
  savedPipelineId: string;
}): SavedEventPipeline => ({
  id: savedPipelineId,
  loop: pipeline.loop,
  name: pipeline.name.trim(),
  savedAt: new Date().toISOString(),
  steps: pipeline.steps.map((step) =>
    step.kind === 'delay'
      ? {
          kind: 'delay',
          ms: step.ms,
        }
      : {
          eventType: step.eventType,
          kind: 'emit',
          payload: step.payload,
          payloadMode: step.payloadMode,
        },
  ),
});

export const hydrateSavedPipeline = ({
  createId,
  savedPipeline,
}: {
  createId: (prefix: string) => string;
  savedPipeline: SavedEventPipeline;
}): EventPipeline => ({
  id: createId('pipeline'),
  loop: savedPipeline.loop,
  name: savedPipeline.name,
  steps: savedPipeline.steps.map((step) =>
    step.kind === 'delay'
      ? {
          id: createId('pipeline-step'),
          kind: 'delay' as const,
          ms: step.ms,
        }
      : {
          emitCount: 0,
          eventType: step.eventType,
          id: createId('pipeline-step'),
          kind: 'emit' as const,
          lastEmittedAt: null,
          payload: step.payload,
          payloadMode: step.payloadMode,
        },
  ),
});
