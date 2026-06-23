import { useMemo, useRef } from 'react';

import type { AriaLivePriority } from '../useAriaLiveAnnouncer';
import { useAriaLiveAnnouncer } from '../useAriaLiveAnnouncer';
import { useDebouncedAnnounce } from '../scheduling';
import { useTranslationContext } from '../../../context/TranslationContext';

type TranslateFn = ReturnType<typeof useTranslationContext>['t'];

/**
 * Parameters accepted by each parameterized interaction announcement.
 * Interactions that take no parameters map to `undefined`.
 */
export type InteractionAnnouncementParams = {
  'giphy.canceled': undefined;
  'giphy.sent': undefined;
  'giphy.shuffled': { title?: string };
  'poll.sent': undefined;
  'suggestions.count': { count: number; suggestionsLabel?: string };
  'user.selected': { user: string };
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
 * Per-interaction debounce delay (ms). Only list rapidly-updating streams where just the
 * settled value should be read (e.g. the autocomplete count as the query filters). Discrete
 * confirmations (Giphy/Poll sent, user selected) are NOT listed and announce immediately.
 */
const INTERACTION_DEBOUNCE_MS: Partial<Record<InteractionAnnouncementType, number>> = {
  'suggestions.count': 300,
};

// One shared debounced channel covers all debounced interactions. If more than one is added
// with differing delays, switch to a per-interaction channel keyed by type.
const DEBOUNCE_CHANNEL_DELAY_MS = INTERACTION_DEBOUNCE_MS['suggestions.count'] ?? 300;

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
  const { announce: announceDebounced } = useDebouncedAnnounce(
    announce,
    DEBOUNCE_CHANNEL_DELAY_MS,
  );
  // Last message sent on the debounced channel — skip re-announcing an unchanged value.
  const lastDebouncedMessageRef = useRef<string | null>(null);

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

        if (INTERACTION_DEBOUNCE_MS[interaction] === undefined) {
          announce(message, priority);
          return;
        }

        // Debounced stream (e.g. suggestions.count): coalesce rapid updates and skip a
        // repeat of the value just announced.
        if (message === lastDebouncedMessageRef.current) return;
        lastDebouncedMessageRef.current = message;
        announceDebounced(message, priority);
      },
    }),
    [announce, announceDebounced, t],
  );
};
