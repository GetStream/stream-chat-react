import type { StateStore } from 'stream-chat';

import type { ChatView } from '../ChatView';

export type LayoutSlot = string;
export type LayoutMode = string;
export type LayoutView = ChatView;

export type LayoutSlotBinding = {
  key?: string;
  payload: unknown;
};

export type LayoutSlotMeta = {
  occupiedAt?: number;
};

export type ChatViewLayoutState = {
  activeSlot?: LayoutSlot;
  activeView: ChatView;
  entityListPaneOpen: boolean;
  hiddenSlots?: Record<LayoutSlot, boolean | undefined>;
  maxSlots?: number;
  minSlots?: number;
  mode: LayoutMode;
  slotBindings: Record<LayoutSlot, LayoutSlotBinding | undefined>;
  slotHistory?: Record<LayoutSlot, LayoutSlotBinding[] | undefined>;
  slotMeta: Record<LayoutSlot, LayoutSlotMeta | undefined>;
  visibleSlots: LayoutSlot[];
};

export type ResolveTargetSlotArgs = {
  activeSlot?: LayoutSlot;
  binding: LayoutSlotBinding;
  requestedSlot?: LayoutSlot;
  state: ChatViewLayoutState;
};

export type DuplicateSlotPolicy = 'allow' | 'move' | 'reject';
/** @deprecated Use DuplicateSlotPolicy */
export type DuplicateEntityPolicy = DuplicateSlotPolicy;

export type ResolveDuplicateSlotArgs = {
  activeSlot?: LayoutSlot;
  binding: LayoutSlotBinding;
  existingSlot: LayoutSlot;
  requestedSlot?: LayoutSlot;
  state: ChatViewLayoutState;
};

export type ResolveDuplicateSlot = (
  args: ResolveDuplicateSlotArgs,
) => DuplicateSlotPolicy;
/** @deprecated Use ResolveDuplicateSlot */
export type ResolveDuplicateEntity = ResolveDuplicateSlot;

export type ResolveTargetSlot = (args: ResolveTargetSlotArgs) => LayoutSlot | null;

export type OpenResult =
  | { slot: LayoutSlot; status: 'opened' }
  | { replaced: LayoutSlotBinding; slot: LayoutSlot; status: 'replaced' }
  | { reason: 'duplicate-binding' | 'no-available-slot'; status: 'rejected' };

export type OpenOptions = {
  activate?: boolean;
  targetSlot?: LayoutSlot;
};

export type CloseOptions = {
  restoreFromHistory?: boolean;
};

export type OpenViewOptions = {
  activateSlot?: boolean;
  slot?: LayoutSlot;
};

export type SerializedLayoutSlotBinding = {
  key?: string;
  payload: unknown;
};

export type ChatViewLayoutSnapshot = {
  activeSlot?: LayoutSlot;
  activeView: LayoutView;
  entityListPaneOpen: boolean;
  hiddenSlots: Record<LayoutSlot, boolean | undefined>;
  mode: LayoutMode;
  slotBindings: Record<LayoutSlot, SerializedLayoutSlotBinding | undefined>;
  slotHistory: Record<LayoutSlot, SerializedLayoutSlotBinding[] | undefined>;
  slotMeta: Record<LayoutSlot, LayoutSlotMeta | undefined>;
  visibleSlots: LayoutSlot[];
};

export type SerializeLayoutSlotBinding = (
  binding: LayoutSlotBinding,
) => SerializedLayoutSlotBinding | undefined;
/** @deprecated Use SerializeLayoutSlotBinding */
export type SerializeLayoutEntityBinding = SerializeLayoutSlotBinding;

export type DeserializeLayoutSlotBinding = (
  binding: SerializedLayoutSlotBinding,
) => LayoutSlotBinding | undefined;
/** @deprecated Use DeserializeLayoutSlotBinding */
export type DeserializeLayoutEntityBinding = DeserializeLayoutSlotBinding;

export type SerializeLayoutStateOptions = {
  serializeSlotBinding?: SerializeLayoutSlotBinding;
  /** @deprecated Use serializeSlotBinding */
  serializeEntityBinding?: SerializeLayoutEntityBinding;
};

export type RestoreLayoutStateOptions = {
  deserializeSlotBinding?: DeserializeLayoutSlotBinding;
  /** @deprecated Use deserializeSlotBinding */
  deserializeEntityBinding?: DeserializeLayoutEntityBinding;
};

export type CreateLayoutControllerOptions = {
  duplicateSlotPolicy?: DuplicateSlotPolicy;
  /** @deprecated Use duplicateSlotPolicy */
  duplicateEntityPolicy?: DuplicateEntityPolicy;
  initialState?: Partial<ChatViewLayoutState>;
  resolveDuplicateSlot?: ResolveDuplicateSlot;
  /** @deprecated Use resolveDuplicateSlot */
  resolveDuplicateEntity?: ResolveDuplicateEntity;
  resolveTargetSlot?: ResolveTargetSlot;
  state?: StateStore<ChatViewLayoutState>;
};

export type LayoutController = {
  bind: (slot: LayoutSlot, binding?: LayoutSlotBinding) => void;
  clear: (slot: LayoutSlot) => void;
  close: (slot: LayoutSlot, options?: CloseOptions) => void;
  open: (binding: LayoutSlotBinding, options?: OpenOptions) => OpenResult;
  openView: (view: LayoutView, options?: OpenViewOptions) => void;
  popParent: (slot: LayoutSlot) => LayoutSlotBinding | undefined;
  pushParent: (slot: LayoutSlot, binding: LayoutSlotBinding) => void;
  setActiveView: (next: ChatView) => void;
  setEntityListPaneOpen: (next: boolean) => void;
  setMode: (next: LayoutMode) => void;
  setSlotHidden: (slot: LayoutSlot, hidden: boolean) => void;
  state: StateStore<ChatViewLayoutState>;
  toggleEntityListPane: () => void;
};
