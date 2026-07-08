import type { StateStore } from 'stream-chat';

import type { ChatView } from '../ChatView';

export type SlotName = string;
export type LayoutView = ChatView;

export type LayoutSlotBinding = {
  key?: string;
  payload: unknown;
};

export type LayoutSlotMeta = {
  occupiedAt?: number;
};

export type ChatViewLayoutViewState = {
  availableSlots: SlotName[];
  hiddenSlots: Record<SlotName, boolean | undefined>;
  slotBindings: Record<SlotName, LayoutSlotBinding | undefined>;
  slotHistory: Record<SlotName, LayoutSlotBinding[] | undefined>;
  slotForwardHistory: Record<SlotName, LayoutSlotBinding[] | undefined>;
  slotMeta: Record<SlotName, LayoutSlotMeta | undefined>;
  slotNames?: SlotName[];
};

// D7 — per-layout runtime state. A "view" is just a named layout; each layout
// keeps its own slot runtime state (bindings/history/hidden/…). Structurally
// identical to the projected `ChatViewLayoutViewState`.
export type LayoutRuntimeState = ChatViewLayoutViewState;

export type ChatViewLayoutState = {
  activeView: ChatView;
  maxSlots?: number;
  minSlots?: number;
  // One map keyed by layout id (was seven parallel `*ByView` maps).
  layouts?: Partial<Record<ChatView, LayoutRuntimeState>>;
};

export type ResolveTargetSlotArgs = {
  activeViewState: ChatViewLayoutViewState;
  binding: LayoutSlotBinding;
  requestedSlot?: SlotName;
  state: ChatViewLayoutState;
};

export type DuplicateEntityPolicy = 'allow' | 'move' | 'reject';

export type ResolveDuplicateEntityArgs = {
  activeViewState: ChatViewLayoutViewState;
  binding: LayoutSlotBinding;
  existingSlot: SlotName;
  requestedSlot?: SlotName;
  state: ChatViewLayoutState;
};

export type ResolveDuplicateEntity = (
  args: ResolveDuplicateEntityArgs,
) => DuplicateEntityPolicy;

export type ResolveTargetSlot = (args: ResolveTargetSlotArgs) => SlotName | null;

export type OpenResult =
  | { slot: SlotName; status: 'opened' }
  | { replaced: LayoutSlotBinding; slot: SlotName; status: 'replaced' }
  | { reason: 'duplicate-binding' | 'no-available-slot'; status: 'rejected' };

export type OpenOptions = {
  targetSlot?: SlotName;
};

export type OpenViewOptions = {
  slot?: SlotName;
};

export type SerializedLayoutSlotBinding = {
  key?: string;
  payload: unknown;
};

export type SerializedLayoutRuntimeState = {
  availableSlots: SlotName[];
  hiddenSlots: Record<SlotName, boolean | undefined>;
  slotBindings: Record<SlotName, SerializedLayoutSlotBinding | undefined>;
  slotForwardHistory: Record<SlotName, SerializedLayoutSlotBinding[] | undefined>;
  slotHistory: Record<SlotName, SerializedLayoutSlotBinding[] | undefined>;
  slotMeta: Record<SlotName, LayoutSlotMeta | undefined>;
  slotNames?: SlotName[];
};

export type ChatViewLayoutSnapshot = {
  activeView: LayoutView;
  layouts: Partial<Record<ChatView, SerializedLayoutRuntimeState>>;
};

export type SerializeLayoutEntityBinding = (
  binding: LayoutSlotBinding,
) => SerializedLayoutSlotBinding | undefined;

export type DeserializeLayoutEntityBinding = (
  binding: SerializedLayoutSlotBinding,
) => LayoutSlotBinding | undefined;

export type SerializeLayoutStateOptions = {
  serializeEntityBinding?: SerializeLayoutEntityBinding;
};

export type RestoreLayoutStateOptions = {
  deserializeEntityBinding?: DeserializeLayoutEntityBinding;
};

// `initialState` also accepts a flat single-view shorthand: the per-view runtime fields
// (availableSlots/hiddenSlots/slotBindings/…) may be given at the top level and are folded
// into the active view's layout (an explicit `layouts[activeView]` still wins).
export type CreateLayoutControllerInitialState = Partial<ChatViewLayoutState> &
  Partial<LayoutRuntimeState>;

export type CreateLayoutControllerOptions = {
  duplicateEntityPolicy?: DuplicateEntityPolicy;
  initialState?: CreateLayoutControllerInitialState;
  resolveDuplicateEntity?: ResolveDuplicateEntity;
  state?: StateStore<ChatViewLayoutState>;
};

export type LayoutController = {
  bind: (slot: SlotName, binding: LayoutSlotBinding) => void;
  release: (slot: SlotName) => void;
  setAvailableSlots: (slots: SlotName[]) => void;
  setSlotNames: (slots?: SlotName[]) => void;
  goBack: (slot: SlotName) => void;
  goForward: (slot: SlotName) => void;
  hide: (slot: SlotName) => void;
  openInLayout: (binding: LayoutSlotBinding, options?: OpenOptions) => OpenResult;
  openView: (view: LayoutView, options?: OpenViewOptions) => void;
  setActiveView: (next: ChatView) => void;
  state: StateStore<ChatViewLayoutState>;
  unhide: (slot: SlotName) => void;
};
