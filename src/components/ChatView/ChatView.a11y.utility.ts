/**
 * Right now, a11y in ChatView does one thing: it provides correct ARIA
 * relationships for tabs.
 *
 * Specifically:
 * - ChatView.Selector is role="tablist".
 * - Each selector button is role="tab" with:
 *   - unique id
 *   - aria-controls=<panel-id>
 *   - aria-selected
 *   - active-only tabIndex=0 (-1 for inactive)
 * - Active panel container is role="tabpanel" with:
 *   - id=<panel-id>
 *   - aria-labelledby=<tab-id>
 *
 * The a11y helper module exists to generate and share those tab/panel IDs per
 * ChatView instance, so tab ↔ tabpanel linkage stays correct and collision-safe
 * when multiple ChatViews exist.
 */
export type ChatViewA11yContextValue = {
  // tab.id -> panel[aria-labelledby], and tab[aria-controls] -> panel.id
  chatViewPanelIds: Record<'channels' | 'threads', string>;
  chatViewTabIds: Record<'channels' | 'threads', string>;
};

export const DEFAULT_CHAT_VIEW_A11Y_CONTEXT_VALUE: ChatViewA11yContextValue = {
  chatViewPanelIds: {
    channels: 'str-chat__chat-view-panel-channels',
    threads: 'str-chat__chat-view-panel-threads',
  },
  chatViewTabIds: {
    channels: 'str-chat__chat-view-tab-channels',
    threads: 'str-chat__chat-view-tab-threads',
  },
};

export const createChatViewA11yContextValue = (
  chatViewId: string,
): ChatViewA11yContextValue => ({
  // Keep IDs unique per ChatView instance so ARIA references do not collide.
  chatViewPanelIds: {
    channels: `str-chat__chat-view-${chatViewId}-panel-channels`,
    threads: `str-chat__chat-view-${chatViewId}-panel-threads`,
  },
  chatViewTabIds: {
    channels: `str-chat__chat-view-${chatViewId}-tab-channels`,
    threads: `str-chat__chat-view-${chatViewId}-tab-threads`,
  },
});
