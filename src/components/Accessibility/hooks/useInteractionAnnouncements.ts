import { useMemo, useRef } from 'react';

import type { AriaLivePriority } from '../useAriaLiveAnnouncer';
import { useAriaLiveAnnouncer } from '../useAriaLiveAnnouncer';
import { useDebouncedAnnounce } from '../scheduling';
import { useTranslationContext } from '../../../context/TranslationContext';

type TranslateFn = ReturnType<typeof useTranslationContext>['t'];

/**
 * Delivery overrides passed alongside an interaction's message params. `debounceMs` overrides the
 * interaction's default debounce for this call and enables debouncing for one that has none.
 * `delayMs` overrides the default delay of the immediate path. `debounceMs` wins when both are set,
 * and interactions without params are always immediate.
 *
 * A debounce runs on a per-call-site timer that is cancelled when the call site unmounts, which
 * suits a value that keeps changing in place. `delayMs` is scheduled in the announcer provider and
 * survives the caller unmounting, which suits a one-shot confirmation whose origin disappears.
 */
export type InteractionDeliveryOptions = { debounceMs?: number; delayMs?: number };

/**
 * Params of each interaction announcement. Interactions without params map to `undefined`; the
 * others also accept {@link InteractionDeliveryOptions}.
 */
export type InteractionAnnouncementParams = {
  /** The audio playback rate changed. `rate` is the new multiplier. */
  'audioPlayer.playbackRateChanged': InteractionDeliveryOptions & { rate: number };
  /** A channel was opened from the list. `name` is its display title. */
  'channel.opened': InteractionDeliveryOptions & { name: string };
  /** A slash command was picked from the Instant Commands menu. `command` is its name. */
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
  /** A poll option was picked up to start a keyboard reorder. `option` is its text or fallback. */
  'poll.optionPickedUp': InteractionDeliveryOptions & { option: string };
  'poll.optionRemoved': InteractionDeliveryOptions & { option: string };
  'poll.sent': undefined;
  'search.cleared': undefined;
  'search.resultCount': InteractionDeliveryOptions & {
    /** Whether every active source is fully loaded; appends an "all results loaded" clause. */
    allResultsLoaded?: boolean;
    count: number;
  };
  'suggestions.count': InteractionDeliveryOptions & {
    count: number;
    suggestionsLabel?: string;
  };
  /** A thread was opened from the list. `name` is its channel's display title. */
  'thread.opened': InteractionDeliveryOptions & { name: string };
  'user.selected': InteractionDeliveryOptions & { user: string };
  /** A finished voice recording was added to the composer (async multi-send, not sent yet). */
  'voiceRecording.attached': undefined;
  'voiceRecording.paused': undefined;
  'voiceRecording.resumed': undefined;
  /** A finished voice recording was sent immediately as a message. */
  'voiceRecording.sent': undefined;
  'voiceRecording.started': undefined;
};

export type InteractionAnnouncementType = keyof InteractionAnnouncementParams;

/**
 * One resolver per interaction. Each calls `t()` with a literal key and inline English copy,
 * because `yarn build-translations` extracts keys from the call sites and misses dynamic keys.
 * A new interaction needs an entry here and in {@link InteractionAnnouncementParams}, plus one in
 * {@link INTERACTION_PRIORITIES} if it is not `polite`.
 */
const INTERACTION_MESSAGES: {
  [T in InteractionAnnouncementType]: (
    t: TranslateFn,
    params: InteractionAnnouncementParams[T],
  ) => string;
} = {
  // Reuses the already-localized button label so the spoken text matches the control.
  'audioPlayer.playbackRateChanged': (t, params) =>
    t('common.playbackSpeedX.label', 'Playback speed {{ rate }}x', { rate: params.rate }),
  // Delayed (see INTERACTION_DELAY_MS) so it lands after the screen reader announces the element
  // that auto-focuses on channel change (the composer), which would otherwise supersede it.
  'channel.opened': (t, params) =>
    t(
      'a11y.interactionAnnouncements.openedChannel.ariaLabel',
      'Opened channel: {{ name }}',
      { name: params.name },
    ),
  // Delayed like the "opened" confirmations: selecting a command closes the menu and focuses the
  // composer textarea, whose name the screen reader reads first.
  'command.selected': (t, params) =>
    t(
      'a11y.interactionAnnouncements.commandActivated.ariaLabel',
      'Command activated: {{ command }}',
      { command: params.command },
    ),
  'giphy.canceled': (t) =>
    t('a11y.interactionAnnouncements.giphyCanceled.ariaLabel', 'Giphy canceled'),
  'giphy.sent': (t) =>
    t('a11y.interactionAnnouncements.giphySent.ariaLabel', 'Giphy sent'),
  // Giphy payloads rarely carry a title, so it is included only when present.
  'giphy.shuffled': (t, params) =>
    params.title
      ? t(
          'a11y.interactionAnnouncements.giphyImageChanged.withTitle.ariaLabel',
          'Giphy image changed: {{ title }}',
          { title: params.title },
        )
      : t(
          'a11y.interactionAnnouncements.giphyImageChanged.ariaLabel',
          'Giphy image changed',
        ),
  // Reuses the already-localized visible description between an "opened" confirmation and the
  // Enter affordance, so spoken and visible text stay consistent.
  'poll.dialogOpened': (t) =>
    `${t('a11y.interactionAnnouncements.pollDialogOpened.ariaLabel', 'Poll dialog opened')}. ${t(
      'common.createQuestionAddOptions.label',
      'Create a question, add options, and configure poll settings',
    )}. ${t('a11y.interactionAnnouncements.pressEnterStartTyping.ariaLabel', 'Press Enter to start typing')}.`,
  'poll.optionDropped': (t, params) =>
    t(
      'a11y.interactionAnnouncements.droppedPosition.ariaLabel',
      'Dropped "{{ option }}" at position {{ position }}.',
      {
        option: params.option,
        position: params.position,
      },
    ),
  'poll.optionPickedUp': (t, params) =>
    t(
      'a11y.interactionAnnouncements.pickedUpUseArrow.ariaLabel',
      'Picked up "{{ option }}". Use arrow keys to reorder. Press Space or Tab to drop.',
      { option: params.option },
    ),
  // Polite, so it queues behind the focus move to the next option field instead of interrupting it.
  'poll.optionRemoved': (t, params) =>
    t(
      'a11y.interactionAnnouncements.removedOption.ariaLabel',
      'Removed option {{ option }}',
      { option: params.option },
    ),
  'poll.sent': (t) => t('a11y.interactionAnnouncements.pollSent.ariaLabel', 'Poll sent'),
  'search.cleared': (t) =>
    t('a11y.interactionAnnouncements.searchCleared.ariaLabel', 'Search cleared'),
  // An empty result set is spelled out rather than announced as "0". The end-of-list status is part
  // of this announcement (reusing the footer's "All results loaded" text), so no second message
  // supersedes the count.
  'search.resultCount': (t, params) => {
    if (params.count <= 0)
      return t(
        'a11y.interactionAnnouncements.noSearchResultsFound.ariaLabel',
        'No search results found',
      );
    const count = t('a11y.interactionAnnouncements.searchResults.ariaLabel', {
      count: params.count,
      defaultValue_one: '{{ count }} search result',
      defaultValue_other: '{{ count }} search results',
    });
    return params.allResultsLoaded
      ? `${count}. ${t('common.resultsLoaded.label', 'All results loaded')}`
      : count;
  },
  // Names the suggestion type by reusing the already-localized list label (e.g. "5 Command
  // Suggestions"); without a label it is the bare count.
  'suggestions.count': (t, params) =>
    params.suggestionsLabel
      ? t('a11y.interactionAnnouncements.suggestionsWithLabel.ariaLabel', {
          count: params.count,
          defaultValue_one: '{{ count }} {{ suggestionsLabel }}',
          defaultValue_other: '{{ count }} {{ suggestionsLabel }}',
          suggestionsLabel: params.suggestionsLabel,
        })
      : t('a11y.interactionAnnouncements.suggestions.ariaLabel', {
          count: params.count,
          defaultValue_one: '{{ count }} suggestion',
          defaultValue_other: '{{ count }} suggestions',
        }),
  // Delayed like `channel.opened`: the thread composer auto-focuses on open and its focus
  // announcement would otherwise supersede this one.
  'thread.opened': (t, params) =>
    t(
      'a11y.interactionAnnouncements.openedThread.ariaLabel',
      'Opened thread in {{ name }}',
      { name: params.name },
    ),
  'user.selected': (t, params) =>
    t(
      'a11y.interactionAnnouncements.userSelected.ariaLabel',
      'User selected: {{ user }}',
      { user: params.user },
    ),
  // Voice recording cancellation and errors are not listed: they surface as notifications announced
  // by `NotificationAnnouncer`, so listing them here would announce them twice.
  'voiceRecording.attached': (t) =>
    t(
      'a11y.interactionAnnouncements.voiceRecordingAttached.ariaLabel',
      'Voice recording attached',
    ),
  'voiceRecording.paused': (t) =>
    t('a11y.interactionAnnouncements.recordingPaused.ariaLabel', 'Recording paused'),
  'voiceRecording.resumed': (t) =>
    t('a11y.interactionAnnouncements.recordingResumed.ariaLabel', 'Recording resumed'),
  'voiceRecording.sent': (t) =>
    t('a11y.interactionAnnouncements.voiceMessageSent.ariaLabel', 'Voice message sent'),
  'voiceRecording.started': (t) =>
    t('a11y.interactionAnnouncements.recordingStarted.ariaLabel', 'Recording started'),
};

/** Per-interaction aria-live priority. Interactions default to `polite`. */
const INTERACTION_PRIORITIES: Partial<
  Record<InteractionAnnouncementType, AriaLivePriority>
> = {
  // A polite update fired around the dialog's focus announcement is dropped; assertive is spoken.
  'poll.dialogOpened': 'assertive',
  // Keyboard reorder feedback must be immediate, not queued behind polite messages.
  'poll.optionDropped': 'assertive',
  'poll.optionPickedUp': 'assertive',
};

/**
 * Per-interaction dedupe window (ms), see {@link AriaLiveAnnounceOptions.dedupeMs}. List an
 * interaction only when one event can fire it more than once in quick succession, e.g. an effect
 * double-invoked by React StrictMode.
 */
const INTERACTION_DEDUPE_MS: Partial<Record<InteractionAnnouncementType, number>> = {
  // Widgets rendering the same asset for the same requester share one pooled player, so one rate
  // change fires this from each of them. Consecutive rates differ in text, so a change is not lost.
  'audioPlayer.playbackRateChanged': 300,
  'poll.dialogOpened': 1000,
};

/**
 * Default per-interaction debounce (ms), for rapidly updating values where only the settled one
 * should be read. Discrete confirmations are not listed and announce immediately. A call can
 * override or opt in via `params.debounceMs`, see {@link InteractionDeliveryOptions}.
 *
 * `suggestions.count` follows typing, so its delay also lets the screen reader's per-keystroke
 * echo finish: a polite update landing mid-echo is queued behind it and gets buried. Echo length
 * varies with screen-reader settings and field content, so tune the value if it still collides.
 */
const INTERACTION_DEBOUNCE_MS: Partial<Record<InteractionAnnouncementType, number>> = {
  // Same rationale as `suggestions.count`, but longer because search results arrive over the
  // network in bursts.
  'search.resultCount': 1000,
  'suggestions.count': 500,
};

/**
 * Default per-interaction delay (ms) for the immediate path: a single deferred emit scheduled in
 * the announcer provider (see {@link AriaLiveAnnounceOptions.delayMs}), so it survives the caller
 * unmounting, unlike a debounce.
 *
 * Opening a channel or thread focuses the composer, and a live-region message emitted alongside the
 * screen reader's focus announcement is dropped, so the delay moves the confirmation past it.
 * Selecting the item can unmount its list row (the whole list on mobile), which would cancel a
 * per-row debounce.
 */
const INTERACTION_DELAY_MS: Partial<Record<InteractionAnnouncementType, number>> = {
  'channel.opened': 1500,
  'command.selected': 1500,
  'thread.opened': 1500,
};

// Overloads require params for parameterized interactions and reject them for param-less ones.
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
  /** Announces a predefined interaction; it maps to a localized message and a fixed priority. */
  announceInteraction: AnnounceInteraction;
  /**
   * Cancels pending (debounced or delayed, not yet emitted) announcements: one `interaction`, or
   * all when omitted. Call it when the source is torn down so a queued message is not spoken out
   * of context. An announcement already emitted into the live region cannot be recalled.
   */
  cancelInteraction: (interaction?: InteractionAnnouncementType) => void;
};

/**
 * Typed wrapper over {@link useAriaLiveAnnouncer} for transient, user-initiated UI interactions.
 * Each interaction maps to an i18n key and a fixed priority, and is registered as one entry in
 * {@link INTERACTION_MESSAGES}.
 */
export const useInteractionAnnouncements = (): UseInteractionAnnouncementsValue => {
  const announce = useAriaLiveAnnouncer();
  const { t } = useTranslationContext();
  // One debounce timer per interaction type; each call passes its own delay.
  const { announce: announceDebounced, cancel: cancelDebounced } =
    useDebouncedAnnounce(announce);
  // Cancel function of the pending provider-delayed emit per interaction; a re-trigger within the
  // delay supersedes it. Not cleared on unmount: delayed emits are meant to survive the caller
  // (e.g. `channel.opened` fires after its list row is gone).
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

        // A per-call `debounceMs` overrides the default and can opt an immediate interaction in.
        const debounceMs =
          (params as InteractionDeliveryOptions | undefined)?.debounceMs ??
          INTERACTION_DEBOUNCE_MS[interaction];
        if (debounceMs === undefined) {
          // Immediate path; `delayMs` is a provider-managed deferral that survives this call site
          // unmounting.
          const delayMs =
            (params as InteractionDeliveryOptions | undefined)?.delayMs ??
            INTERACTION_DELAY_MS[interaction];
          // A re-trigger within the delay window supersedes the pending emit, so only the latest is
          // spoken.
          pendingImmediateCancelsRef.current[interaction]?.();
          pendingImmediateCancelsRef.current[interaction] = announce(message, {
            dedupeMs: INTERACTION_DEDUPE_MS[interaction],
            delayMs,
            priority,
          });
          return;
        }

        // Rapid updates collapse into the settled value, keyed by interaction type. An unchanged
        // message is not deduped here: whether a repeat is meaningful is up to the caller (a steady
        // suggestion count still re-announces on each re-filter).
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
