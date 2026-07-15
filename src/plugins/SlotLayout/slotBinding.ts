// Leaf module: entity-binding primitives shared by ChatView, the generic <Slot>
// dispatcher, and the slot renderer registry. Kept free of ChatView.tsx *value*
// imports so `Slot`/`slotRegistry` can consume it without an import cycle
// (ChatView -> WorkspaceLayout -> Slot -> slotRegistry -> here).

import type { Channel as StreamChannel, Thread } from 'stream-chat';
import type { ReactNode } from 'react';
import type { ChatView } from './ChatView';
import type {
  LayoutSlotBinding,
  SlotName,
} from './layoutController/layoutControllerTypes';

export type UserListEntitySource = {
  query: string;
};

// D7 (iii) — list kinds carry no source; the layout that seeds them picks the
// kind (`channelList` vs `threadList`), so the old `source.view` indirection is gone.
export type ChannelListEntitySource = Record<string, never>;
export type ThreadListEntitySource = Record<string, never>;

export type SearchResultsEntitySource = {
  query: string;
};

export type UserProfileEntitySource = {
  userId: string;
};

export type ChatViewEntityBinding =
  | { key?: string; kind: 'channelList'; source: ChannelListEntitySource }
  | { key?: string; kind: 'threadList'; source: ThreadListEntitySource }
  | { key?: string; kind: 'channel'; source: StreamChannel }
  | { key?: string; kind: 'thread'; source: Thread }
  | { key?: string; kind: 'memberList'; source: StreamChannel }
  | { key?: string; kind: 'userList'; source: UserListEntitySource }
  | { key?: string; kind: 'searchResults'; source: SearchResultsEntitySource }
  | { key?: string; kind: 'pinnedMessagesList'; source: StreamChannel }
  | { key?: string; kind: 'userProfile'; source: UserProfileEntitySource };

export type ChatViewEntityKind = ChatViewEntityBinding['kind'];

export type LayoutEntityByKind<TKind extends ChatViewEntityKind> = Extract<
  ChatViewEntityBinding,
  { kind: TKind }
>;

export type ChatViewSlotRendererProps<TKind extends ChatViewEntityKind> = {
  entity: LayoutEntityByKind<TKind>;
  slot: string;
  source: LayoutEntityByKind<TKind>['source'];
};

export type ChatViewSlotFallbackProps = {
  slot: string;
};

/**
 * App-facing per-kind render overrides. A thin projection of the renderer
 * registry: supplying `slotRenderers[kind]` overrides only that kind's
 * `Component` while inheriting the built-in policy (`persistent`/`view`).
 */
export type ChatViewSlotRenderers = Partial<{
  [TKind in ChatViewEntityKind]: (props: ChatViewSlotRendererProps<TKind>) => ReactNode;
}>;

const isChatViewEntityBinding = (value: unknown): value is ChatViewEntityBinding => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ChatViewEntityBinding>;
  return typeof candidate.kind === 'string' && 'source' in candidate;
};

export const getChatViewEntityBinding = (
  binding?: LayoutSlotBinding,
): ChatViewEntityBinding | undefined =>
  isChatViewEntityBinding(binding?.payload) ? binding.payload : undefined;

export const createChatViewSlotBinding = (
  entity: ChatViewEntityBinding,
): LayoutSlotBinding => ({
  key: entity.key ? `${entity.kind}:${entity.key}` : undefined,
  payload: entity,
});

/**
 * Declarative layout preset (D7). A "view" is a `LayoutDescriptor`: a named slot
 * structure plus optional bindings to seed into those slots. Switching view =
 * activating a layout; each layout keeps its own slot state (remembered snapshot).
 */
export type LayoutDescriptor = {
  id: ChatView;
  slots: SlotName[];
  initialBindings?: Partial<Record<SlotName, ChatViewEntityBinding>>;
};
