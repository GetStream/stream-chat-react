import { useMemo, useRef } from 'react';

import type { AriaLivePriority } from '../useAriaLiveAnnouncer';
import { useAriaLiveAnnouncer } from '../useAriaLiveAnnouncer';
import { useDebouncedAnnounce } from '../scheduling';
import { useTranslationContext } from '../../../context/TranslationContext';

type TranslateFn = ReturnType<typeof useTranslationContext>['t'];

/**
 * Optional delivery overrides a call site may pass ALONGSIDE an interaction's message params.
 * These are not consumed by the message resolver — they only affect how the announcement is
 * delivered. `debounceMs` overrides that interaction's default debounce ({@link
 * INTERACTION_DEBOUNCE_MS}) for THIS call, and enables debouncing for an interaction that has no
 * default. `delayMs` overrides the default delay ({@link INTERACTION_DELAY_MS}) for the
 * (non-debounced) immediate path. Param-less (discrete) interactions are always immediate and do
 * not accept overrides.
 *
 * `debounceMs` vs `delayMs`: a debounce collapses rapid repeats on a per-call-site timer and is
 * **cancelled if that call site unmounts** — right for a value that keeps changing in place (a
 * result count). `delayMs` schedules a single deferred emit in the shared announcer PROVIDER, so it
 * **survives the caller unmounting** — right for a one-shot confirmation whose origin (e.g. a list
 * row) disappears on the very action being confirmed (opening a channel/thread hides the list on
 * mobile). Both let the message land after a competing focus/typing read-out. `debounceMs` wins if
 * both are given.
 */
export type InteractionDeliveryOptions = { debounceMs?: number; delayMs?: number };

/**
 * Parameters accepted by each parameterized interaction announcement.
 * Interactions that take no parameters map to `undefined`. Param-ful interactions additionally
 * accept {@link InteractionDeliveryOptions} (e.g. a per-call `debounceMs`).
 */
export type InteractionAnnouncementParams = {
  /** A channel was opened from the channel list. `name` is its display title. */
  'channel.opened': InteractionDeliveryOptions & { name: string };
  /** A slash command was activated from the Instant Commands menu. `command` is its name. */
  'command.selected': InteractionDeliveryOptions & { command: string };
  'giphy.canceled': undefined;
  'giphy.sent': undefined;
  'giphy.shuffled': InteractionDeliveryOptions & { title?: string };
  'poll.dialogOpened': undefined;
  /** A poll option was dropped at a new position during keyboard reorder. */
  'poll.optionDropped': InteractionDeliveryOptions & {
    option: string;
    position: number;
  };
  /** A poll option was picked up to start a keyboard reorder. `option` is its text (or a fallback). */
  'poll.optionPickedUp': InteractionDeliveryOptions & { option: string };
  'poll.optionRemoved': InteractionDeliveryOptions & { option: string };
  'poll.sent': undefined;
  'search.cleared': undefined;
  'search.resultCount': InteractionDeliveryOptions & {
    /** Whether every active source is fully loaded — appends an "all results loaded" clause. */
    allResultsLoaded?: boolean;
    count: number;
  };
  'suggestions.count': InteractionDeliveryOptions & {
    count: number;
    suggestionsLabel?: string;
  };
  /** A thread was opened from the thread list. `name` is its channel's display title. */
  'thread.opened': InteractionDeliveryOptions & { name: string };
  'user.selected': InteractionDeliveryOptions & { user: string };
  /** A finished voice recording was added to the composer (async multi-send: not sent yet). */
  'voiceRecording.attached': undefined;
  'voiceRecording.paused': undefined;
  'voiceRecording.resumed': undefined;
  /** A finished voice recording was sent immediately as a message. */
  'voiceRecording.sent': undefined;
  'voiceRecording.started': undefined;
};

export type InteractionAnnouncementType = keyof InteractionAnnouncementParams;

/**
 * One entry per interaction — the single place an interaction is registered. Each
 * resolver contains a LITERAL `t('aria/…')` call so that `i18next-cli extract`
 * (run via `yarn build-translations`) discovers and generates the key across all
 * locales. Keys must never be built dynamically (e.g. `t(someVariable)`) or
 * extraction silently misses them. Adding an interaction = one line here + one
 * line in {@link InteractionAnnouncementParams} (+ an override in
 * {@link INTERACTION_PRIORITIES} only if it is not `polite`).
 */
const INTERACTION_MESSAGES: {
  [T in InteractionAnnouncementType]: (
    t: TranslateFn,
    params: InteractionAnnouncementParams[T],
  ) => string;
} = {
  // Confirms which channel was opened after selecting it from the list. Delayed (see
  // INTERACTION_DELAY_MS) so it lands AFTER the screen reader's announcement of the newly-focused
  // element (the message composer auto-focuses on channel change) rather than competing with — and
  // being superseded by — that native focus read-out. A provider-managed delay (not a per-row
  // debounce) so it still fires when selecting the channel unmounts the list (mobile).
  'channel.opened': (t, params) =>
    t('aria/Opened channel: {{ name }}', { name: params.name }),
  // Confirms which slash command was activated after picking it from the Instant Commands menu.
  // Delayed (INTERACTION_DELAY_MS) for the same reason as the "opened" confirmations: selecting a
  // command closes the menu and focuses the composer textarea (whose name changes, e.g. to
  // "Search GIFs"), so the screen reader reads that focus first — this lands after it. A provider
  // delay (not a debounce) because the menu that fired it unmounts on selection.
  'command.selected': (t, params) =>
    t('aria/Command activated: {{ command }}', { command: params.command }),
  'giphy.canceled': (t) => t('aria/Giphy canceled'),
  'giphy.sent': (t) => t('aria/Giphy sent'),
  // Giphy payloads rarely carry a human title, so include it only when present; otherwise a
  // generic "changed" confirmation. Both literal keys are extracted by i18next-cli.
  'giphy.shuffled': (t, params) =>
    params.title
      ? t('aria/Giphy image changed: {{ title }}', { title: params.title })
      : t('aria/Giphy image changed'),
  // Spoken on poll-dialog open. Reuses the already-localized visible description for the middle
  // clause (so the spoken and visible text stay consistent) and adds two short aria-only phrases:
  // an explicit "opened" confirmation and the Enter affordance to step into the Question field.
  'poll.dialogOpened': (t) =>
    `${t('aria/Poll dialog opened')}. ${t(
      'Create a question, add options, and configure poll settings',
    )}. ${t('aria/Press Enter to start typing')}.`,
  // Keyboard reorder pickup/drop. Assertive (see INTERACTION_PRIORITIES) — immediate drag feedback
  // that must not be queued behind other polite messages.
  'poll.optionDropped': (t, params) =>
    t('aria/Dropped "{{ option }}" at position {{ position }}.', {
      option: params.option,
      position: params.position,
    }),
  'poll.optionPickedUp': (t, params) =>
    t(
      'aria/Picked up "{{ option }}". Use arrow keys to reorder. Press Space or Tab to drop.',
      { option: params.option },
    ),
  // Confirms a poll option was removed, naming it by its text (or positional fallback). Polite so it
  // queues behind the focus move to the next option field instead of interrupting it.
  'poll.optionRemoved': (t, params) =>
    t('aria/Removed option {{ option }}', { option: params.option }),
  'poll.sent': (t) => t('aria/Poll sent'),
  'search.cleared': (t) => t('aria/Search cleared'),
  // The number of items currently listed in the search results; an empty result set is spelled out
  // rather than announced as "0". When the list is fully loaded, the end-of-list status is folded
  // into THIS one announcement (reusing the visible footer's "All results loaded" text) instead of a
  // competing second live-region message that would supersede the count.
  'search.resultCount': (t, params) => {
    if (params.count <= 0) return t('aria/No search results found');
    const count = t('aria/{{ count }} search results', { count: params.count });
    return params.allResultsLoaded ? `${count}. ${t('All results loaded')}` : count;
  },
  // Name the suggestion type by reusing the already-localized list label ("5 Command
  // Suggestions") so the user knows what the results are; fall back to the bare count when no
  // label is given. Both literal keys are extracted.
  'suggestions.count': (t, params) =>
    params.suggestionsLabel
      ? t('aria/{{ count }} {{ suggestionsLabel }}', {
          count: params.count,
          suggestionsLabel: params.suggestionsLabel,
        })
      : t('aria/{{ count }} suggestions', { count: params.count }),
  // Confirms which thread was opened after selecting it from the list; `name` is the thread's
  // channel display title. Delayed for the same reason as `channel.opened` (the thread composer
  // auto-focuses on open, and its focus announcement would otherwise supersede this one).
  'thread.opened': (t, params) =>
    t('aria/Opened thread in {{ name }}', { name: params.name }),
  'user.selected': (t, params) =>
    t('aria/User selected: {{ user }}', { user: params.user }),
  // Voice recorder lifecycle — discrete, immediate, polite confirmations. Cancellation is NOT here:
  // it already emits an app notification ("Voice message deleted") announced by NotificationAnnouncer,
  // and recording errors surface as error notifications; adding them here would double-announce.
  'voiceRecording.attached': (t) => t('aria/Voice recording attached'),
  'voiceRecording.paused': (t) => t('aria/Recording paused'),
  'voiceRecording.resumed': (t) => t('aria/Recording resumed'),
  'voiceRecording.sent': (t) => t('aria/Voice message sent'),
  'voiceRecording.started': (t) => t('aria/Recording started'),
};

/**
 * Per-interaction aria-live priority. Interactions default to `polite`; list one
 * here only to override it (e.g. with `assertive`).
 */
const INTERACTION_PRIORITIES: Partial<
  Record<InteractionAnnouncementType, AriaLivePriority>
> = {
  // Assertive on open: a polite update fired around the dialog's focus-entry announcement is
  // dropped; assertive interrupts and is spoken (VoiceOver demotes the aria-describedby hint).
  'poll.dialogOpened': 'assertive',
  // Keyboard reorder feedback must be immediate (interrupt), not queued behind polite messages.
  'poll.optionDropped': 'assertive',
  'poll.optionPickedUp': 'assertive',
};

/**
 * Per-interaction dedupe window (ms): an identical message for this interaction is announced at
 * most once per window (see {@link AriaLiveAnnounceOptions.dedupeMs}). List an interaction here
 * only when the SAME open/mount can fire it more than once in quick succession — e.g. a mount
 * effect double-invoked by React StrictMode (dev) — so the user does not hear a duplicate.
 */
const INTERACTION_DEDUPE_MS: Partial<Record<InteractionAnnouncementType, number>> = {
  'poll.dialogOpened': 1000,
};

/**
 * Default per-interaction debounce delay (ms). Only list rapidly-updating streams where just the
 * settled value should be read (e.g. the autocomplete count as the query filters). Discrete
 * confirmations (Giphy/Poll sent, user selected) are NOT listed and announce immediately. A call
 * site can override (or opt into) a delay for a single call via `params.debounceMs` — see
 * {@link InteractionDeliveryOptions}.
 *
 * `suggestions.count` is a CONSEQUENCE OF TYPING, so the delay does double duty: it coalesces
 * rapid filters into the settled value AND lets the screen reader's per-keystroke typing echo
 * (the spoken character + field re-read) finish first. A polite update that lands mid-echo gets
 * queued behind a long re-read and is perceived as buried; waiting past the echo makes the count
 * the next thing spoken once the user pauses. This is a heuristic — echo length varies with the
 * SR's "speak typed words/characters" setting and field content — so tune if it still collides.
 */
const INTERACTION_DEBOUNCE_MS: Partial<Record<InteractionAnnouncementType, number>> = {
  // Coalesce the result count as the query filters / results stream in, and let the screen reader's
  // typing echo finish first (same rationale as `suggestions.count`, slightly longer as search
  // results can arrive over the network in bursts). The end-of-list status rides along in this same
  // message (see `search.resultCount` resolver), so there is no second announcement to compete.
  'search.resultCount': 1000,
  'suggestions.count': 500,
};

/**
 * Default per-interaction delay (ms) for the immediate (non-debounced) path — a single deferred
 * emit scheduled in the announcer PROVIDER (see {@link AriaLiveAnnounceOptions.delayMs}), so it
 * SURVIVES the calling component unmounting (unlike a debounce, whose timer is cleared on unmount).
 *
 * Opening a channel/thread moves focus to the (auto-focusing) message composer; the screen reader
 * announces that newly-focused element first, and a live-region message emitted alongside it is
 * superseded and dropped. The delay defers the confirmation past that focus read-out so it is spoken
 * next, in a calm moment. It is a provider delay rather than a debounce specifically because
 * selecting the item can unmount its list row (and the whole list, on mobile) — a per-row debounce
 * would be cancelled mid-flight, swallowing the confirmation.
 */
const INTERACTION_DELAY_MS: Partial<Record<InteractionAnnouncementType, number>> = {
  'channel.opened': 1500,
  'command.selected': 1500,
  'thread.opened': 1500,
};

// Overloads enforce that parameterized interactions require their params and that
// param-less interactions reject extra arguments.
type AnnounceInteraction = {
  <T extends InteractionAnnouncementType>(
    interaction: InteractionAnnouncementParams[T] extends undefined ? T : never,
  ): void;
  <T extends InteractionAnnouncementType>(
    interaction: InteractionAnnouncementParams[T] extends undefined ? never : T,
    params: InteractionAnnouncementParams[T],
  ): void;
};

export type UseInteractionAnnouncementsValue = {
  /**
   * Announce a predefined interaction event to assistive technology. The
   * interaction name maps to a localized message and a baked-in aria-live
   * priority.
   */
  announceInteraction: AnnounceInteraction;
  /**
   * Cancel pending (debounced, not-yet-spoken) announcements: a single `interaction`, or all when
   * omitted. Call this when the source of a debounced announcement is torn down (e.g. search exited)
   * so a queued message is not spoken after its context is gone. An announcement already emitted into
   * the live region cannot be recalled.
   */
  cancelInteraction: (interaction?: InteractionAnnouncementType) => void;
};

/**
 * Thin, typed wrapper over the aria-live announcer exposing intention-revealing
 * helpers for transient, user-initiated UI interactions (e.g. a Giphy being
 * sent, a poll being created, a mention being picked). They map to i18n keys with
 * baked-in priorities and reuse the existing live region via
 * {@link useAriaLiveAnnouncer}. New interactions are registered as a single entry
 * in {@link INTERACTION_MESSAGES}.
 */
export const useInteractionAnnouncements = (): UseInteractionAnnouncementsValue => {
  const announce = useAriaLiveAnnouncer();
  const { t } = useTranslationContext();
  // Per-interaction debounce: each type has its own timer + delay from INTERACTION_DEBOUNCE_MS,
  // so e.g. the typing-driven `suggestions.count` can wait longer (to clear the screen reader's
  // typing echo) without affecting any other debounced interaction.
  const { announce: announceDebounced, cancel: cancelDebounced } =
    useDebouncedAnnounce(announce);
  // Cancel fn of the still-pending provider-delayed emit per interaction. A second trigger of the
  // same interaction within its delay window supersedes the first (so only the latest is spoken).
  // NOT cleared on unmount on purpose — provider-delayed emits are designed to survive the caller
  // unmounting (e.g. channel.opened fires after its list row is gone).
  const pendingImmediateCancelsRef = useRef<
    Partial<Record<InteractionAnnouncementType, () => void>>
  >({});

  return useMemo(
    () => ({
      announceInteraction: (
        interaction: InteractionAnnouncementType,
        params?: InteractionAnnouncementParams[InteractionAnnouncementType],
      ) => {
        const resolveMessage = INTERACTION_MESSAGES[interaction] as (
          t: TranslateFn,
          params: InteractionAnnouncementParams[InteractionAnnouncementType],
        ) => string;

        if (!resolveMessage) return;

        const message = resolveMessage(t, params as never);
        const priority = INTERACTION_PRIORITIES[interaction] ?? 'polite';

        // A per-call `params.debounceMs` overrides the registered default (and can opt an
        // otherwise-immediate interaction into debouncing).
        const debounceMs =
          (params as InteractionDeliveryOptions | undefined)?.debounceMs ??
          INTERACTION_DEBOUNCE_MS[interaction];
        if (debounceMs === undefined) {
          // Immediate path. `delayMs` (if any) is a provider-managed deferral that survives this
          // call site unmounting — used by the "opened" confirmations, whose list row disappears on
          // selection. `debounceMs` takes precedence over `delayMs` when both are set.
          const delayMs =
            (params as InteractionDeliveryOptions | undefined)?.delayMs ??
            INTERACTION_DELAY_MS[interaction];
          // Supersede a still-pending delayed emit of the same interaction so a rapid re-trigger
          // (e.g. selecting a second channel within the 1500ms window) speaks only the latest.
          pendingImmediateCancelsRef.current[interaction]?.();
          pendingImmediateCancelsRef.current[interaction] = announce(message, {
            dedupeMs: INTERACTION_DEDUPE_MS[interaction],
            delayMs,
            priority,
          });
          return;
        }

        // Debounced stream (e.g. suggestions.count): coalesce rapid updates into the settled
        // value, on a channel keyed by interaction type with that type's own delay. We do NOT
        // dedupe an unchanged message here — whether a repeat is meaningful is the caller's call
        // (e.g. SuggestionList re-announces the count on each genuine re-filter so the user gets
        // feedback even when the count is steady, such as emoji results capped at a constant N).
        // The debounce window already collapses idle/rapid duplicates.
        announceDebounced(interaction, message, debounceMs, priority);
      },
      cancelInteraction: (interaction?: InteractionAnnouncementType) => {
        cancelDebounced(interaction);
        const pending = pendingImmediateCancelsRef.current;
        if (interaction) {
          pending[interaction]?.();
          delete pending[interaction];
        } else {
          Object.values(pending).forEach((cancel) => cancel?.());
          pendingImmediateCancelsRef.current = {};
        }
      },
    }),
    [announce, announceDebounced, cancelDebounced, t],
  );
};
