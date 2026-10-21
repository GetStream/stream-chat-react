import type { StateStore } from '@stream-io/state-store';

import type { ChatView } from '../ChatView';

export type SlotName = string;
export type LayoutView = ChatView;

/** What a slot shows: `payload` is rendered in it and the optional `key` identifies duplicates. */
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
  /**
   * Per-slot layers stacked above the base `slotBindings[slot]`, bottom layer first. While a slot
   * has layers, its base and every layer stay mounted and only the topmost is visible, so revealing
   * a lower layer restores its state (e.g. a thread's scroll position). The base remounts when the
   * first layer is pushed and when the last is popped. Left out of serialization: a reload
   * restores only the base bindings.
   */
  slotLayers?: Record<SlotName, LayoutSlotBinding[] | undefined>;
  slotMeta: Record<SlotName, LayoutSlotMeta | undefined>;
  slotNames?: SlotName[];
};

/** Slot state of one view's layout; each view keeps its own. */
export type LayoutRuntimeState = ChatViewLayoutViewState;

export type ChatViewLayoutState = {
  activeView: ChatView;
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
  | { slot: SlotName; status: 'layered' }
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

/**
 * Initial layout state. Per-view runtime fields (e.g. `availableSlots`, `slotBindings`) may also
 * sit at the top level; they seed the active view's layout unless `layouts[activeView]` is given.
 */
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
  /** Pushes a binding onto the top of `slot`'s layer stack. */
  pushLayer: (slot: SlotName, binding: LayoutSlotBinding) => void;
  /** Pops the top layer of `slot`. Does nothing when it has none. */
  popLayer: (slot: SlotName) => void;
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
