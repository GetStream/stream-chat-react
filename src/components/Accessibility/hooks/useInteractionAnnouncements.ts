import { useMemo } from 'react';

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
 * default. Param-less (discrete) interactions are always immediate and do not accept overrides.
 */
export type InteractionDeliveryOptions = { debounceMs?: number };

/**
 * Parameters accepted by each parameterized interaction announcement.
 * Interactions that take no parameters map to `undefined`. Param-ful interactions additionally
 * accept {@link InteractionDeliveryOptions} (e.g. a per-call `debounceMs`).
 */
export type InteractionAnnouncementParams = {
  'giphy.canceled': undefined;
  'giphy.sent': undefined;
  'giphy.shuffled': InteractionDeliveryOptions & { title?: string };
  'poll.dialogOpened': undefined;
  'poll.sent': undefined;
  'search.allResultsLoaded': undefined;
  'search.cleared': undefined;
  'search.resultCount': InteractionDeliveryOptions & { count: number };
  'suggestions.count': InteractionDeliveryOptions & {
    count: number;
    suggestionsLabel?: string;
  };
  'user.selected': InteractionDeliveryOptions & { user: string };
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
  'poll.sent': (t) => t('aria/Poll sent'),
  // Reuses the visible footer text so spoken and visible "end of list" stay consistent.
  'search.allResultsLoaded': (t) => t('All results loaded'),
  'search.cleared': (t) => t('aria/Search cleared'),
  // The number of items currently listed in the search results; an empty result set is spelled out
  // rather than announced as "0".
  'search.resultCount': (t, params) =>
    params.count > 0
      ? t('aria/{{ count }} search results', { count: params.count })
      : t('aria/No search results found'),
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
  'user.selected': (t, params) =>
    t('aria/User selected: {{ user }}', { user: params.user }),
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
  // Defer the end-of-list status until the results have settled — fired immediately on the
  // load-complete transition it is coalesced away by the screen reader reading the freshly rendered
  // results (and by the `search.resultCount` update that lands ~1s later). The longer window puts it
  // AFTER the count, so the user hears "N results" then "All results loaded" in a calm moment.
  'search.allResultsLoaded': 1500,
  // Coalesce the result count as the query filters / results stream in, and let the screen reader's
  // typing echo finish first (same rationale as `suggestions.count`, slightly longer as search
  // results can arrive over the network in bursts).
  'search.resultCount': 1000,
  'suggestions.count': 500,
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
          announce(message, { dedupeMs: INTERACTION_DEDUPE_MS[interaction], priority });
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
      cancelInteraction: (interaction?: InteractionAnnouncementType) =>
        cancelDebounced(interaction),
    }),
    [announce, announceDebounced, cancelDebounced, t],
  );
};
