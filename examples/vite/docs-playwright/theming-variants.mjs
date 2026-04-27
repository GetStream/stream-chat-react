/**
 * CSS override blocks for each code example in the React theming doc
 *   docs-content: chat-sdk/react/v14-latest/02-ui-components/02-theming/01-themingv2.md
 *
 * Keep the blocks here in sync with the doc. Each entry lists:
 *   - `docSection`: which heading in the doc the block belongs to
 *   - `screenshot`:  the asset filename the capture pipeline writes
 *   - `theme`:       which SDK theme URL param to use ("light" or "dark")
 *   - `css`:         the raw CSS to inject via Playwright `page.addStyleTag`
 *
 * Whenever you edit the doc, edit the matching entry here so the capture
 * script and the doc never drift apart.
 */

// -- §"Global variables" ------------------------------------------------------
// Semantic tokens actually consumed by v14's built CSS.
// See 01-themingv2.md first ```css @layer stream-overrides { ... }``` block.
const CSS_GLOBAL_VARS = `
@layer stream-overrides {
  .str-chat {
    --accent-primary: #0d47a1;

    --chat-bg-outgoing: #1e3a8a;
    --chat-bg-attachment-outgoing: #0d47a1;
    --chat-bg-incoming: #dbeafe;
    --chat-text-outgoing: #ffffff;
    --chat-reply-indicator-outgoing: #93c5fd;

    --text-link: #1e40af;
    --chat-text-link: #93c5fd;

    --background-core-elevation-1: #dbeafe;
    --background-core-app: #c7dafc;

    --border-utility-focused: #1e40af;

    --radius-max: 8px;
    --button-radius-full: 6px;
  }
}`;

// -- §"Component variables" — avatar colors -----------------------------------
// Uses v14's avatar-specific tokens (--avatar-bg-default / --avatar-text-default).
const CSS_AVATAR_COLOR = `
@layer stream-overrides {
  .str-chat {
    --accent-primary: #0d47a1;
    --chat-bg-outgoing: #1e3a8a;
    --chat-text-outgoing: #ffffff;
    --chat-bg-incoming: #dbeafe;

    --avatar-bg-default: #bf360c;
    --avatar-text-default: #ffffff;
  }
}`;

// -- §"Component variables" — message bubble text color -----------------------
// Extends the avatar block with a component-level bubble text color.
const CSS_MESSAGE_BUBBLE = `
@layer stream-overrides {
  .str-chat {
    --accent-primary: #0d47a1;
    --chat-bg-outgoing: #1e3a8a;
    --chat-text-outgoing: #ffffff;
    --chat-bg-incoming: #dbeafe;

    --avatar-bg-default: #bf360c;
    --avatar-text-default: #ffffff;

    --str-chat__message-bubble-color: #00695c;
  }
}`;

// -- §"Dark and light themes" — per-theme palettes ----------------------------
// Applied to .str-chat__theme-light / .str-chat__theme-dark scopes so both
// modes can be themed independently.
const CSS_CUSTOM_DARK = `
@layer stream-overrides {
  .str-chat {
    --radius-max: 8px;
    --button-radius-full: 6px;
  }
  .str-chat__theme-light {
    --accent-primary: #0d47a1;
    --chat-bg-outgoing: #1e3a8a;
    --chat-bg-incoming: #dbeafe;
    --chat-text-outgoing: #ffffff;
    --text-link: #1e40af;
    --background-core-elevation-1: #dbeafe;
    --background-core-app: #c7dafc;
    --avatar-bg-default: #bf360c;
    --avatar-text-default: #ffffff;
  }
  .str-chat__theme-dark {
    --accent-primary: #4a90e2;
    --chat-bg-outgoing: #1e3a8a;
    --chat-bg-incoming: #1f2937;
    --chat-text-outgoing: #e2e8f0;
    --chat-text-incoming: #e2e8f0;
    --text-link: #93c5fd;
    --background-core-elevation-1: #0f172a;
    --background-core-app: #020617;
    --avatar-bg-default: #ff7043;
    --avatar-text-default: #ffffff;
  }
}`;

// -- §"Creating your own theme" — square variant ------------------------------
// The doc shows round vs square via --radius-max (40 consumers in v14 CSS).
// We capture the "square" variant; "round" matches the SDK default.
const CSS_SQUARE_THEME = `
@layer stream-overrides {
  .str-chat {
    --radius-max: 6px;
    --button-radius-full: 6px;
  }
}`;

// ---------------------------------------------------------------------------

export const variants = [
  {
    docSection: 'Global variables',
    screenshot: 'stream-chat-css-chat-ui-theme-customization-screenshot.png',
    theme: 'light',
    css: CSS_GLOBAL_VARS,
  },
  {
    docSection: 'Component variables — avatar',
    screenshot: 'stream-chat-css-custom-avatar-color-screenshot.png',
    theme: 'light',
    css: CSS_AVATAR_COLOR,
  },
  {
    docSection: 'Component variables — message bubble',
    screenshot: 'stream-chat-css-message-color-customization-screenshot.png',
    theme: 'light',
    css: CSS_MESSAGE_BUBBLE,
  },
  {
    docSection: 'Dark and light themes — custom palettes',
    screenshot: 'stream-chat-css-custom-dark-theme-screenshot.png',
    theme: 'dark',
    css: CSS_CUSTOM_DARK,
  },
  {
    docSection: 'Creating your own theme — square',
    screenshot: 'stream-chat-css-square-theme-screenshot.png',
    theme: 'light',
    css: CSS_SQUARE_THEME,
  },
];

// Baseline screenshots that don't inject any override CSS (just theme + url).
export const baselineVariants = [
  {
    docSection: 'Default light UI',
    screenshot: 'stream-chat-css-chat-ui-screenshot.png',
    theme: 'light',
    css: null,
  },
  {
    docSection: 'Default message (before custom color)',
    screenshot: 'stream-chat-css-message-color-screenshot.png',
    theme: 'light',
    css: null,
  },
  {
    docSection: 'Default dark UI',
    screenshot: 'stream-chat-css-dark-ui-screenshot.png',
    theme: 'dark',
    css: null,
  },
];

// RTL needs a DOM-level toggle, not CSS — handled by the capture script.
export const rtlVariant = {
  docSection: 'RTL support',
  screenshot: 'stream-chat-css-rtl-layout-screenshot.png',
  theme: 'light',
  css: null,
};
