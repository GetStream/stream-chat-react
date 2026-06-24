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
  'poll.sent': undefined;
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
  'poll.sent': (t) => t('aria/Poll sent'),
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
> = {};

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
  const { announce: announceDebounced } = useDebouncedAnnounce(announce);

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
          announce(message, priority);
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
    }),
    [announce, announceDebounced, t],
  );
};
