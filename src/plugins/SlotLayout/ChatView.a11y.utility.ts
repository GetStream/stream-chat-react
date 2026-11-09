// ChatView views are independent surfaces, not panels of one WAI-ARIA Tabs widget, so their
// containers carry only an ID. `createChatViewA11yContextValue` builds per-instance IDs so
// skip-links and programmatic focus have stable hooks when several ChatViews coexist.

export type ChatViewA11yContextValue = {
  chatViewPanelIds: Record<'channels' | 'threads', string>;
};

export const DEFAULT_CHAT_VIEW_A11Y_CONTEXT_VALUE: ChatViewA11yContextValue = {
  chatViewPanelIds: {
    channels: 'str-chat__chat-view-panel-channels',
    threads: 'str-chat__chat-view-panel-threads',
  },
};

export const createChatViewA11yContextValue = (
  chatViewId: string,
): ChatViewA11yContextValue => ({
  chatViewPanelIds: {
    channels: `str-chat__chat-view-${chatViewId}-panel-channels`,
    threads: `str-chat__chat-view-${chatViewId}-panel-threads`,
  },
});
