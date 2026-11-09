// Entity-binding primitives shared by ChatView, `<Slot>` and the slot renderer registry. It has no
// value imports from ChatView.tsx, so `Slot` and `slotRegistry` can use it without an import cycle.

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

// List kinds carry no source: the layout that seeds them picks `channelList` or `threadList`.
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
 * Per-kind render overrides: `slotRenderers[kind]` replaces only that kind's `Component` and keeps
 * its built-in `persistent` and `view` policy.
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
 * Declarative layout of a view: its slot names plus optional bindings seeded into them. Each layout
 * keeps its own slot state across view switches.
 */
export type LayoutDescriptor = {
  id: ChatView;
  slots: SlotName[];
  initialBindings?: Partial<Record<SlotName, ChatViewEntityBinding>>;
};
