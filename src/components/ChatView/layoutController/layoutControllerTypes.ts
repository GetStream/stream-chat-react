import type {
  StateStore,
  Channel as StreamChannel,
  Thread as StreamThread,
} from 'stream-chat';

import type { ChatView } from '../ChatView';

export type LayoutSlot = string;
export type LayoutMode = string;
export type LayoutView = ChatView;

export type UserListEntitySource = {
  query: string;
};

export type ChannelListEntitySource = {
  view?: ChatView;
};

export type SearchResultsEntitySource = {
  query: string;
};

export type LayoutEntityBinding =
  | { key?: string; kind: 'channelList'; source: ChannelListEntitySource }
  | { key?: string; kind: 'channel'; source: StreamChannel }
  | { key?: string; kind: 'thread'; source: StreamThread }
  | { key?: string; kind: 'memberList'; source: StreamChannel }
  | { key?: string; kind: 'userList'; source: UserListEntitySource }
  | { key?: string; kind: 'searchResults'; source: SearchResultsEntitySource }
  | { key?: string; kind: 'pinnedMessagesList'; source: StreamChannel };

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
  slotBindings: Record<LayoutSlot, LayoutEntityBinding | undefined>;
  slotHistory?: Record<LayoutSlot, LayoutEntityBinding[] | undefined>;
  slotMeta: Record<LayoutSlot, LayoutSlotMeta | undefined>;
  visibleSlots: LayoutSlot[];
};

export type ResolveTargetSlotArgs = {
  activeSlot?: LayoutSlot;
  entity: LayoutEntityBinding;
  requestedSlot?: LayoutSlot;
  state: ChatViewLayoutState;
};

export type DuplicateEntityPolicy = 'allow' | 'move' | 'reject';

export type ResolveDuplicateEntityArgs = {
  activeSlot?: LayoutSlot;
  entity: LayoutEntityBinding;
  existingSlot: LayoutSlot;
  requestedSlot?: LayoutSlot;
  state: ChatViewLayoutState;
};

export type ResolveDuplicateEntity = (
  args: ResolveDuplicateEntityArgs,
) => DuplicateEntityPolicy;

export type ResolveTargetSlot = (args: ResolveTargetSlotArgs) => LayoutSlot | null;

export type OpenResult =
  | { slot: LayoutSlot; status: 'opened' }
  | { replaced: LayoutEntityBinding; slot: LayoutSlot; status: 'replaced' }
  | { reason: 'duplicate-entity' | 'no-available-slot'; status: 'rejected' };

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

export type SerializedLayoutEntityBinding = {
  key?: string;
  kind: LayoutEntityBinding['kind'];
  source: unknown;
};

export type ChatViewLayoutSnapshot = {
  activeSlot?: LayoutSlot;
  activeView: LayoutView;
  entityListPaneOpen: boolean;
  hiddenSlots: Record<LayoutSlot, boolean | undefined>;
  mode: LayoutMode;
  slotBindings: Record<LayoutSlot, SerializedLayoutEntityBinding | undefined>;
  slotHistory: Record<LayoutSlot, SerializedLayoutEntityBinding[] | undefined>;
  slotMeta: Record<LayoutSlot, LayoutSlotMeta | undefined>;
  visibleSlots: LayoutSlot[];
};

export type SerializeLayoutEntityBinding = (
  entity: LayoutEntityBinding,
) => SerializedLayoutEntityBinding | undefined;

export type DeserializeLayoutEntityBinding = (
  entity: SerializedLayoutEntityBinding,
) => LayoutEntityBinding | undefined;

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
  bind: (slot: LayoutSlot, entity?: LayoutEntityBinding) => void;
  clear: (slot: LayoutSlot) => void;
  close: (slot: LayoutSlot, options?: CloseOptions) => void;
  open: (entity: LayoutEntityBinding, options?: OpenOptions) => OpenResult;
  openView: (view: LayoutView, options?: OpenViewOptions) => void;
  openChannel: (channel: StreamChannel, options?: OpenOptions) => OpenResult;
  openMemberList: (channel: StreamChannel, options?: OpenOptions) => OpenResult;
  openPinnedMessagesList: (channel: StreamChannel, options?: OpenOptions) => OpenResult;
  openThread: (thread: StreamThread, options?: OpenOptions) => OpenResult;
  openUserList: (source: UserListEntitySource, options?: OpenOptions) => OpenResult;
  popParent: (slot: LayoutSlot) => LayoutEntityBinding | undefined;
  pushParent: (slot: LayoutSlot, entity: LayoutEntityBinding) => void;
  setActiveView: (next: ChatView) => void;
  setEntityListPaneOpen: (next: boolean) => void;
  setMode: (next: LayoutMode) => void;
  setSlotHidden: (slot: LayoutSlot, hidden: boolean) => void;
  state: StateStore<ChatViewLayoutState>;
  toggleEntityListPane: () => void;
};
