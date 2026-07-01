/**
 * ChatView is a top-level view switcher between two parallel, independent
 * surfaces (channels and threads). It is NOT a WAI-ARIA Tabs widget: each view
 * owns its own composer and message list and is not a panel of a single
 * composite widget. The selector is a navigation landmark (role="navigation")
 * whose buttons mark the active surface via aria-current="true" (generic
 * "current item"; not "page", since the SDK may be embedded in a larger host UI).
 *
 * The helper generates stable per-instance DOM ids for the view containers so
 * integrators (skip-links, programmatic focus) have predictable hooks even
 * when multiple ChatViews coexist.
 */
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
