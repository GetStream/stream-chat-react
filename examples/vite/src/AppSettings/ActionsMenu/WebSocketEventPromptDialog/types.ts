import type { SupportedWebsocketEventType } from './websocketEventTemplates';

export type PayloadMode = 'fixed' | 'fresh';

export type PipelineEmitStep = {
  emitCount: number;
  eventType: SupportedWebsocketEventType;
  id: string;
  kind: 'emit';
  lastEmittedAt: string | null;
  payload: string;
  payloadMode: PayloadMode;
};

export type PipelineDelayStep = {
  id: string;
  kind: 'delay';
  ms: number;
};

export type PipelineStep = PipelineEmitStep | PipelineDelayStep;

export type EventPipeline = {
  id: string;
  loop: boolean;
  name: string;
  steps: PipelineStep[];
};

export type SavedPipelineEmitStep = {
  eventType: SupportedWebsocketEventType;
  kind: 'emit';
  payload: string;
  payloadMode: PayloadMode;
};

export type SavedPipelineDelayStep = {
  kind: 'delay';
  ms: number;
};

export type SavedPipelineStep = SavedPipelineEmitStep | SavedPipelineDelayStep;

export type SavedEventPipeline = {
  id: string;
  loop: boolean;
  name: string;
  savedAt: string;
  steps: SavedPipelineStep[];
};

export type IntervalEmitter = {
  active: boolean;
  emitCount: number;
  eventType: SupportedWebsocketEventType;
  everyMs: number;
  id: string;
  lastEmittedAt: string | null;
  name: string;
  payload: string;
  payloadMode: PayloadMode;
};

export type DialogMode = 'single' | 'pipeline' | 'intervals';

export type SimulationUser = Record<string, unknown> & {
  id: string;
};

export type SimulationState = {
  membersByCid: Record<string, Record<string, Record<string, unknown>>>;
  messageIdsByCid: Record<string, string[]>;
  nextReactionTypeIndex: number;
  nextSequence: number;
  nextUserIndexByCid: Record<string, number>;
  usersByCid: Record<string, SimulationUser[]>;
};
