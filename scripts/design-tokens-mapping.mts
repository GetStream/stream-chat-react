// How `sync-design-tokens.mts` names the design tokens in the SDK. Names are written without the
// `--str-chat__` prefix.
//
// The SDK's theme variables are its public theming API. Every variable the generated
// `src/styling/light.scss` already declares keeps its name, and takes the definition of the
// design-system-tokens variable of the same name. The tables below cover the exceptions: SDK names
// with no token of their own, SDK definitions kept instead of a token's, and the tokens the SDK
// adds to its API.

/**
 * SDK variables whose token was renamed or removed. Each takes, in every theme, the definition of
 * the token named here (for example `var(--str-chat__slate-100)`), never a reference to that token.
 * Wherever a definition reads one of these tokens, the sync writes the SDK name instead.
 */
export const TAKES_DEFINITION_OF: Record<string, string> = {
  // Renamed: chat/bg|text|border/* -> message-bubble/*
  'chat-bg-attachment-incoming': 'message-bubble-bg-attachment-incoming',
  'chat-bg-attachment-outgoing': 'message-bubble-bg-attachment-outgoing',
  'chat-bg-incoming': 'message-bubble-bg-incoming',
  'chat-bg-outgoing': 'message-bubble-bg-outgoing',
  'chat-border-incoming': 'message-bubble-border-incoming',
  'chat-border-on-chat-incoming': 'message-bubble-border-on-chat-incoming',
  'chat-border-on-chat-outgoing': 'message-bubble-border-on-chat-outgoing',
  'chat-border-outgoing': 'message-bubble-border-outgoing',
  'chat-text-incoming': 'message-bubble-text-incoming',
  'chat-text-link': 'message-bubble-text-link',
  'chat-text-mention': 'message-bubble-text-mention',
  'chat-text-outgoing': 'message-bubble-text-outgoing',
  'chat-text-reaction': 'message-bubble-text-reaction',
  'chat-text-read': 'message-bubble-text-read',
  'chat-text-system': 'message-bubble-text-system',
  'chat-text-timestamp': 'message-bubble-text-timestamp',
  'chat-text-typing-indicator': 'message-bubble-text-typing-indicator',
  'chat-text-username': 'message-bubble-text-username',

  // Renamed: chat/poll|reply|thread|waveform/* lost the chat prefix
  'chat-poll-progress-fill-incoming': 'poll-progress-fill-incoming',
  'chat-poll-progress-fill-outgoing': 'poll-progress-fill-outgoing',
  'chat-poll-progress-track-incoming': 'poll-progress-track-incoming',
  'chat-poll-progress-track-outgoing': 'poll-progress-track-outgoing',
  'chat-reply-indicator-incoming': 'reply-indicator-incoming',
  'chat-reply-indicator-outgoing': 'reply-indicator-outgoing',
  'chat-thread-connector-incoming': 'thread-connector-incoming',
  'chat-thread-connector-outgoing': 'thread-connector-outgoing',
  'chat-waveform-bar': 'waveform-bar',
  'chat-waveform-bar-playing': 'waveform-bar-playing',

  // Renamed: presence/* -> avatar/presence/*, skeleton-loading/* -> background/utility/*
  'presence-bg-offline': 'avatar-presence-bg-offline',
  'presence-bg-online': 'avatar-presence-bg-online',
  'skeleton-loading-base': 'background-utility-skeleton-loading-base',
  'skeleton-loading-highlight': 'background-utility-skeleton-loading-highlight',

  // Removed: the token with the same value
  'border-core-inverse': 'border-core-on-inverse',
};

/**
 * SDK variables the SDK defines itself, in place of a token's definition or because no token is
 * left. `light` applies to both themes unless `dark` is given.
 *
 * Most keep the SDK variable they read before a token change, so an integrator who overrides that
 * variable still reaches this one.
 */
export const SDK_DEFINITIONS: Record<string, { dark?: string; light: string }> = {
  // The token reads `brand-150` / `brand-900`; the SDK keeps the first avatar palette color.
  'avatar-bg-default': { light: 'var(--str-chat__avatar-palette-bg-1)' },
  'avatar-text-default': { light: 'var(--str-chat__avatar-palette-text-1)' },

  // Removed tokens that read another SDK variable.
  'input-send-icon': { light: 'var(--str-chat__accent-primary)' },
  'input-send-icon-disabled': { light: 'var(--str-chat__text-disabled)' },

  // The token (`avatar-presence-border`) reads `border-core-on-inverse`; the SDK keeps
  // `border-core-inverse`.
  'presence-border': { light: 'var(--str-chat__border-core-inverse)' },

  // Removed: the avatar palette
  'avatar-palette-bg-1': {
    dark: 'var(--str-chat__blue-600)',
    light: 'var(--str-chat__blue-150)',
  },
  'avatar-palette-bg-2': {
    dark: 'var(--str-chat__cyan-600)',
    light: 'var(--str-chat__cyan-150)',
  },
  'avatar-palette-bg-3': {
    dark: 'var(--str-chat__green-600)',
    light: 'var(--str-chat__green-150)',
  },
  'avatar-palette-bg-4': {
    dark: 'var(--str-chat__purple-600)',
    light: 'var(--str-chat__purple-150)',
  },
  'avatar-palette-bg-5': {
    dark: 'var(--str-chat__yellow-600)',
    light: 'var(--str-chat__yellow-150)',
  },
  'avatar-palette-text-1': {
    dark: 'var(--str-chat__blue-100)',
    light: 'var(--str-chat__blue-900)',
  },
  'avatar-palette-text-2': {
    dark: 'var(--str-chat__cyan-100)',
    light: 'var(--str-chat__cyan-900)',
  },
  'avatar-palette-text-3': {
    dark: 'var(--str-chat__green-100)',
    light: 'var(--str-chat__green-900)',
  },
  'avatar-palette-text-4': {
    dark: 'var(--str-chat__purple-100)',
    light: 'var(--str-chat__purple-900)',
  },
  'avatar-palette-text-5': {
    dark: 'var(--str-chat__yellow-100)',
    light: 'var(--str-chat__yellow-900)',
  },
};

/**
 * SDK variables whose definition may read different SDK variables after the next sync. The sync
 * otherwise stops when a definition's reads change, since an integrator's override of the old read
 * would silently stop reaching the variable. Empty this list once that sync is committed.
 */
export const ALLOWED_READ_CHANGES: string[] = [];

/**
 * Tokens the SDK adds to its theme variables. A token is otherwise left out unless an SDK variable
 * reads it through its `var()` chain, so a new token never joins the public API by accident.
 */
export const ADOPTED_TOKENS: string[] = [];
