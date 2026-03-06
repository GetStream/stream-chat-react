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

export type ChatViewLayoutState = {
  activeView: ChatView;
  maxSlots?: number;
  minSlots?: number;
  listSlotByView?: Partial<Record<ChatView, SlotName>>;
  hiddenSlotsByView?: Partial<Record<ChatView, Record<SlotName, boolean | undefined>>>;
  slotBindingsByView?: Partial<
    Record<ChatView, Record<SlotName, LayoutSlotBinding | undefined>>
  >;
  slotHistoryByView?: Partial<
    Record<ChatView, Record<SlotName, LayoutSlotBinding[] | undefined>>
  >;
  slotForwardHistoryByView?: Partial<
    Record<ChatView, Record<SlotName, LayoutSlotBinding[] | undefined>>
  >;
  slotMetaByView?: Partial<
    Record<ChatView, Record<SlotName, LayoutSlotMeta | undefined>>
  >;
  slotNamesByView?: Partial<Record<ChatView, SlotName[] | undefined>>;
  availableSlotsByView?: Partial<Record<ChatView, SlotName[]>>;
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

export type ChatViewLayoutSnapshot = {
  activeView: LayoutView;
  availableSlotsByView: Partial<Record<ChatView, SlotName[]>>;
  hiddenSlotsByView: Partial<Record<ChatView, Record<SlotName, boolean | undefined>>>;
  listSlotByView?: Partial<Record<ChatView, SlotName>>;
  slotBindingsByView: Partial<
    Record<ChatView, Record<SlotName, SerializedLayoutSlotBinding | undefined>>
  >;
  slotHistoryByView: Partial<
    Record<ChatView, Record<SlotName, SerializedLayoutSlotBinding[] | undefined>>
  >;
  slotForwardHistoryByView: Partial<
    Record<ChatView, Record<SlotName, SerializedLayoutSlotBinding[] | undefined>>
  >;
  slotMetaByView: Partial<Record<ChatView, Record<SlotName, LayoutSlotMeta | undefined>>>;
  slotNamesByView: Partial<Record<ChatView, SlotName[] | undefined>>;
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

export type CreateLayoutControllerOptions = {
  duplicateEntityPolicy?: DuplicateEntityPolicy;
  initialState?: Partial<ChatViewLayoutState>;
  resolveDuplicateEntity?: ResolveDuplicateEntity;
  resolveTargetSlot?: ResolveTargetSlot;
  state?: StateStore<ChatViewLayoutState>;
};

export type LayoutController = {
  setSlotBinding: (slot: SlotName, binding?: LayoutSlotBinding) => void;
  setAvailableSlots: (slots: SlotName[]) => void;
  setSlotNames: (slots?: SlotName[]) => void;
  clear: (slot: SlotName) => void;
  goBack: (slot: SlotName) => void;
  goForward: (slot: SlotName) => void;
  hide: (slot: SlotName) => void;
  openInLayout: (binding: LayoutSlotBinding, options?: OpenOptions) => OpenResult;
  openView: (view: LayoutView, options?: OpenViewOptions) => void;
  setActiveView: (next: ChatView) => void;
  state: StateStore<ChatViewLayoutState>;
  unhide: (slot: SlotName) => void;
};
