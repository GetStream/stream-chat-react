export const DESKTOP_LAYOUT_BREAKPOINT = 768;
export const MESSAGE_VIEW_MIN_WIDTH = 360;
/** Primary channels-view slot (the main channel panel). */
export const MAIN_CHANNEL_SLOT = 'main-channel';
/** Secondary channels-view slot — holds either the in-channel reply Thread panel, or a
 *  2nd channel opened side-by-side (ctrl/⌘-click a channel in the list). Shared by the
 *  ChatView layout descriptor and the panels that render whatever is bound. */
export const CHANNEL_THREAD_SLOT = 'channel-thread';
/** Primary threads-view slot (the main open thread). Must match the slot the SDK's
 *  ThreadListItemUI opens into on a plain click. */
export const MAIN_THREAD_SLOT = 'main-thread';
/** Secondary threads-view slot — a 2nd thread opened side-by-side (ctrl/⌘-click a thread in
 *  the list). Must match the slot ThreadListItemUI opens into on ctrl/⌘-click. */
export const OPTIONAL_THREAD_SLOT = 'optional-thread';
