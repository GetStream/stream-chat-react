import type { TranslationContextValue } from '../context/TranslationContext';

/**
 * `notification.message` values emitted by `stream-chat` (the LLC) are English sentences that
 * reach `t()` as a runtime value, so the extractor never sees them and they cannot be renamed
 * from this repo. This table maps the ones we recognise onto the SDK's own keys.
 *
 * Anything not listed falls through unchanged — the same behaviour as before this map existed:
 * the raw English string is displayed.
 *
 * Server-supplied strings keyed by a stable identifier rather than by their English text
 * (slash-command `args`/`description` by command name, Giphy actions by action value) are
 * deliberately *not* here: their components declare those keys in local lookup tables, which
 * keeps them visible to the extractor. Renaming the notification messages at the source needs
 * a `stream-chat` change; until then this table is the seam.
 */
export const EXTERNAL_STRING_KEYS: Record<string, string> = {
  'Command not ready to be sent': 'notification.commandDisabled',
  'Error uploading attachment': 'notification.attachmentUploadFailed',
  'Failed to create the poll': 'notification.pollCreateFailed',
  'Failed to share the location': 'notification.locationShareFailed',
  'File is required for upload attachment': 'notification.attachmentFileMissing',
  'Local upload attachment missing local id': 'notification.attachmentIdMissing',
  'Reached the vote limit. Remove an existing vote first.': 'notification.pollVoteLimit',
  'Wait until all attachments have uploaded': 'notification.attachmentUploadInProgress',
};

/**
 * Translate a string that originated outside the SDK. Known strings resolve through their
 * stable key; unknown ones are returned as-is.
 */
export const translateExternalString = (
  t: TranslationContextValue['t'],
  raw: string | undefined,
  options?: Record<string, unknown>,
): string => {
  if (!raw) return '';
  const key = EXTERNAL_STRING_KEYS[raw];
  // `raw` doubles as the default so a mapped-but-untranslated key still renders English.
  return key ? t(key, raw, options) : t(raw, raw, options);
};
