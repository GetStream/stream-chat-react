export * from './Alert';
export * from './Callout';
export * from './ContextMenu';
export * from './Prompt';
export * from './Viewer';

/**
 * 1. Alert
 *
 * Dialog that warns about danger, risk, or destructive action and requires a decision.
 *
 * Characteristics
 *
 *  - Blocking
 *  - Explicit actions (confirm / cancel)
 *  - High urgency
 *
 * Examples:
 *
 *  - Delete confirmation
 *  - Security warning
 *
 * 2. Callout
 *
 * Non-blocking informational UI that draws attention to something.
 *
 * Characteristics
 *
 *  - Informational
 *  - Often anchored to a UI element
 *  - Usually dismissible
 *
 * Examples:
 *
 *  - Permission instructions
 *  - Feature hints
 *  - Onboarding tips
 *
 * 3. ContextMenu
 *
 * Menu showing actions available for a specific context.
 *
 * Characteristics
 *
 *  - Triggered by right click or button
 *  - Short list of actions
 *  - Usually anchored
 *
 * Examples:
 *
 *  - Message actions
 *  - File actions
 *
 * 4. Prompt
 *
 * Dialog asking the user to provide input.
 *
 * Characteristics
 *
 *  - Input field(s)
 *  - Confirm / cancel
 *  - Blocking interaction
 *
 * Examples:
 *
 *  - Rename item
 *  - Enter URL
 *  - Provide credentials
 *
 *
 * 5. Viewer
 *
 * Dialog that displays data but does not modify it.
 *
 * Characteristics
 *
 *  - Read-only
 *  - May support pagination, scrolling, filtering
 *  - No commit actions
 *
 * Examples:
 *
 * Message history
 *
 *  - Logs
 *  - Search results
 *  - Data preview
 */
