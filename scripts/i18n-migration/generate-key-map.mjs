// Produces a draft old-key -> new-key mapping for the natural-language -> namespaced-key
// migration. The draft is meant to be reviewed by hand; the collision and review reports it
// prints are the parts that need human judgment.
import fs from 'node:fs';

const CALLSITES = process.argv[2];
const OUT = process.argv[3];

const callsites = JSON.parse(fs.readFileSync(CALLSITES, 'utf8'));
const en = JSON.parse(fs.readFileSync('src/i18n/en.json', 'utf8'));

// ---------------------------------------------------------------------------------------
// Namespaces follow the source tree so that a dev editing a component can predict its keys.
// ---------------------------------------------------------------------------------------
const NAMESPACES = {
  'plugins/ChannelDetail': 'channelDetail',
  'plugins/Emojis': 'emojiPicker',
  'plugins/SlotLayout': 'slotLayout',
  'components/AIStateIndicator': 'aiState',
  'components/Accessibility': 'a11y',
  'components/Attachment': 'attachment',
  'components/AudioPlayback': 'audioPlayback',
  'components/BaseImage': 'baseImage',
  'components/Button': 'button',
  'components/Channel': 'channel',
  'components/ChannelHeader': 'channelHeader',
  'components/ChannelList': 'channelList',
  'components/ChannelListItem': 'channelListItem',
  'components/Chat': 'chat',
  'components/Dialog': 'dialog',
  'components/EmptyStateIndicator': 'emptyState',
  'components/Form': 'form',
  'components/Gallery': 'gallery',
  'components/LoadMore': 'loadMore',
  'components/Loading': 'loading',
  'components/Location': 'location',
  'components/MediaRecorder': 'mediaRecorder',
  'components/Message': 'message',
  'components/MessageActions': 'messageActions',
  'components/MessageBounce': 'messageBounce',
  'components/MessageComposer': 'messageComposer',
  'components/MessageList': 'messageList',
  'components/Notifications': 'notification',
  'components/Poll': 'poll',
  'components/ReactFileUtilities': 'fileUpload',
  'components/Reactions': 'reactions',
  'components/Search': 'search',
  'components/SummarizedMessagePreview': 'messagePreview',
  'components/TextareaComposer': 'textareaComposer',
  'components/Thread': 'thread',
  'components/Threads': 'threadList',
  'components/TypingIndicator': 'typing',
  'components/VideoPlayer': 'videoPlayer',
  'src/a11y': 'a11y',
  'src/i18n': 'notification',
};

// Keys resolved from a runtime value, or whose value is a formatter expression rather than
// prose. These get mechanical renames and must keep resolving from en.json (no inline default).
const MECHANICAL = [
  { re: /^language\/(.+)$/, to: (m) => `language.${m[1]}`, prose: true },
  // timestamp/relative* are real copy ("Today", "{{count}}d ago"); the PascalCase entries are
  // formatter expressions and must keep resolving from en.json.
  { re: /^timestamp\/(relative.+)$/, to: (m) => `timestamp.${m[1]}`, prose: true },
  { re: /^timestamp\/(.+)$/, to: (m) => `timestamp.${m[1]}`, prose: false },
  { re: /^duration\/(.+)$/, to: (m) => `duration.${camel(m[1])}`, prose: false },
  {
    re: /^translationBuilderTopic\/(.+)$/,
    to: (m) => `translationBuilderTopic.${m[1]}`,
    prose: false,
  },
  {
    re: /^(\w+)-command-(args|description)$/,
    to: (m) => `command.${m[1]}.${m[2]}`,
    prose: true,
  },
  {
    re: /^search-results-header-filter-source-button-label--(\w+)$/,
    to: (m) => `search.resultsHeader.filterSource.${m[1]}`,
    prose: true,
  },
  {
    re: /^mention\/(\w+) Description$/,
    to: (m) => `mention.${m[1].toLowerCase()}.description`,
    prose: true,
  },
  {
    re: /^placeholder\/(.+)$/,
    to: (m) => `poll.${camel(m[1])}.placeholder`,
    prose: true,
  },
  {
    re: /^ThreadListUnseenThreadsBanner\/(.+)$/,
    to: (m) => `threadList.unseenBanner.${camel(m[1])}`,
    prose: true,
  },
];

// Split on whitespace/punctuation *and* on case boundaries, so an already-camel or Pascal
// identifier ("ChannelHeaderOnlineStatus") yields real words instead of one lowercased blob.
// Hand-authored names for keys where a copy-derived leaf reads badly. The notification set is
// named after the `translatorsByNotificationType` keys rather than the English sentence, so the
// key survives copy edits and lines up with the notification type it renders.
const OVERRIDES = {
  // notifications (see src/i18n/TranslationBuilder/notifications/)
  'Error uploading attachment': 'notification.attachmentUploadFailed',
  'Attachment upload failed due to {{reason}}':
    'notification.attachmentUploadFailedWithReason',
  'Attachment upload blocked due to {{reason}}':
    'notification.attachmentUploadBlockedWithReason',
  'File is required for upload attachment': 'notification.attachmentFileMissing',
  'Local upload attachment missing local id': 'notification.attachmentIdMissing',
  'Wait until all attachments have uploaded': 'notification.attachmentUploadInProgress',
  'Missing permissions to upload the attachment':
    'notification.attachmentUploadForbidden',
  'Failed to create the poll': 'notification.pollCreateFailed',
  'Failed to create the poll due to {{reason}}':
    'notification.pollCreateFailedWithReason',
  'Failed to end the poll': 'notification.pollEndFailed',
  'Failed to end the poll due to {{reason}}': 'notification.pollEndFailedWithReason',
  'Poll ended': 'notification.pollEndSuccess',
  'Reached the vote limit. Remove an existing vote first.': 'notification.pollVoteLimit',
  'Failed to share location': 'notification.locationShareFailed',
  'Failed to retrieve location': 'notification.locationGetFailed',
  'Thread has not been found': 'notification.replySearchFailed',
  'Failed to jump to the first unread message': 'notification.jumpToFirstUnreadFailed',
  'Error reproducing the recording': 'notification.audioPlaybackError',
  'Command not available': 'notification.commandDisabled',
  'Command not available while editing': 'notification.commandDisabledWhileEditing',
  'Command not available while replying': 'notification.commandDisabledWhileReplying',
  // reason values interpolated into the messages above
  'unsupported file type': 'notification.reason.unsupportedFileType',
  'size limit': 'notification.reason.sizeLimit',
  'unknown error': 'notification.reason.unknownError',

  // typing status: one key per arity (see getTypingStatusMessage)
  '{{ typing }} is typing': 'typing.singleUser',
  '{{ typing }} are typing': 'typing.twoUsers',
  '{{ count }} people are typing': 'typing.manyUsers',

  // two distinct recorder failures whose copy differs only in the tail
  'An error has occurred during recording': 'mediaRecorder.error.recording',
  'An error has occurred during the recording processing':
    'mediaRecorder.error.processing',
  'Error starting recording': 'mediaRecorder.error.start',

  // generic vs counted attachment announcements
  'aria/Attachment': 'channelListItem.attachment.ariaLabel',
  'aria/{{ count }} attachment': 'channelListItem.attachmentCount.ariaLabel',

  // the copy is entirely interpolation, so a copy-derived leaf says nothing
  'aria/{{ count }} {{ suggestionsLabel }}':
    'a11y.interactionAnnouncements.suggestionsWithLabel.ariaLabel',

  // microphone/camera permission prompts: heading + body pairs
  'Allow access to microphone': 'mediaRecorder.permissionDenied.microphone.heading',
  'To start recording, allow the microphone access in your browser':
    'mediaRecorder.permissionDenied.microphone.body',
  'Allow access to camera': 'mediaRecorder.permissionDenied.camera.heading',
  'To start recording, allow the camera access in your browser':
    'mediaRecorder.permissionDenied.camera.body',
};

function words(s) {
  return String(s)
    .replace(/\{\{[^}]*\}\}/g, ' ') // drop interpolation placeholders
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // fooBar -> foo Bar
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // AIState -> AI State
    .replace(/[^\p{L}\p{N}]+/gu, ' ') // drop punctuation/emoji
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

// Filler words carry no meaning in an identifier and eat the word budget. Negations are
// deliberately NOT listed: dropping them inverts the meaning of the name.
const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'to',
  'in',
  'into',
  'of',
  'for',
  'your',
  'you',
  'this',
  'that',
  'these',
  'those',
  'and',
  'or',
  'is',
  'are',
  'be',
  'been',
  'will',
  'with',
  'from',
  'at',
  'on',
  'by',
  'it',
  'its',
  'has',
  'have',
  'was',
  'were',
  'do',
  'does',
  'as',
  'so',
  'if',
  'then',
  'there',
  'here',
  'all',
  'any',
  'my',
]);

function camel(s, maxWords = 4) {
  let w = words(s);
  if (!w.length) return 'text';
  // Keep stopwords only if dropping them would leave nothing.
  const trimmed = w.filter((x) => !STOPWORDS.has(x.toLowerCase()));
  if (trimmed.length) w = trimmed;
  return w
    .slice(0, maxWords)
    .map((x, i) => {
      const lower = x.toLowerCase();
      return i === 0 ? lower : lower[0].toUpperCase() + lower.slice(1);
    })
    .join('');
}

// The component segment: the file's own name, unless the file is a helper (utils/index/
// *.defaults/*.a11y), in which case the containing directory is more meaningful.
function componentSegment(file) {
  const parts = file.replace(/\.tsx?$/, '').split('/');
  let base = parts[parts.length - 1];
  const helper = /^(index|utils|utils\.a11y|constants|types|hooks)$/i.test(base);
  base = base.replace(/\.(defaults|a11y)$/i, '');
  if (helper) base = parts[parts.length - 2] ?? base;
  // hooks live in a hooks/ dir: use the hook name minus the `use` prefix
  base = base.replace(/^use([A-Z])/, (_, c) => c.toLowerCase());
  // Component file names are often long compounds (AudioPlayerNotificationsPlugin); three
  // words is enough to identify the component within its namespace.
  return camel(base, 3);
}

function namespaceOf(file) {
  const m = file.match(/^src\/(components|plugins)\/([^/]+)/);
  if (m) return NAMESPACES[`${m[1]}/${m[2]}`] ?? camel(m[2]);
  const dir = file.split('/').slice(0, 2).join('/');
  return NAMESPACES[dir] ?? camel(dir.split('/').pop());
}

// Modality suffix, from the JSX attribute / object property the call sits in.
function suffixOf(rec, isAria) {
  const n = (rec.ctxName ?? '').toLowerCase();
  if (isAria) return n.includes('describedby') ? 'description' : 'ariaLabel';
  if (n === 'aria-label' || n === 'arialabel') return 'ariaLabel';
  if (n === 'placeholder') return 'placeholder';
  if (n === 'title') return 'title';
  if (n === 'description') return 'description';
  if (n === 'heading') return 'heading';
  if (n === 'tooltip') return 'tooltip';
  if (n === 'message' || n === 'text') return 'text';
  return 'label';
}

const bare = (k) => k.replace(/_(one|other|zero|two|few|many)$/, '');
const pluralBases = new Set(
  Object.keys(en)
    .filter((k) => /_(one|other|zero|two|few|many)$/.test(k))
    .map(bare),
);

// ---------------------------------------------------------------------------------------
// Build the draft.
// ---------------------------------------------------------------------------------------
// One old key can appear at several call sites; pick the first (files are walked in a stable
// order) and record the rest so review can spot keys shared across unrelated components.
const byKey = new Map();
for (const r of callsites.records) {
  if (!byKey.has(r.key)) byKey.set(r.key, []);
  byKey.get(r.key).push(r);
}

const map = {};
const meta = {};
const parts = {};
const review = [];

for (const [key, recs] of byKey) {
  if (OVERRIDES[key]) {
    map[key] = OVERRIDES[key];
    meta[key] = {
      prose: true,
      override: true,
      sites: recs.length,
      plural: pluralBases.has(key),
      interpolations: recs[0].interpolations,
      files: [...new Set(recs.map((x) => x.file))],
    };
    continue;
  }
  const mech = MECHANICAL.find((m) => m.re.test(key));
  if (mech) {
    const newKey = mech.to(key.match(mech.re));
    map[key] = newKey;
    meta[key] = { prose: mech.prose, mechanical: true, sites: recs.length };
    continue;
  }

  const isAria = key.startsWith('aria/');
  const copy = isAria ? key.slice('aria/'.length) : key;
  const r = recs[0];
  const namespacesUsed = [...new Set(recs.map((x) => namespaceOf(x.file)))];
  const leaf = camel(copy);
  const suffix = suffixOf(r, isAria);

  // A key used from more than one namespace is shared copy; it belongs in `common.*` rather
  // than being arbitrarily attributed to whichever component happens to be walked first.
  const shared = namespacesUsed.length > 1;
  const ns = shared ? 'common' : namespacesUsed[0];
  const comp = shared ? '' : componentSegment(r.file);

  // `message.messageStatus.…` repeats the namespace inside the component segment; strip it.
  let compSeg = comp;
  if (compSeg.toLowerCase().startsWith(ns.toLowerCase()) && compSeg.length > ns.length) {
    const rest = compSeg.slice(ns.length);
    compSeg = rest[0].toLowerCase() + rest.slice(1);
  }
  // …and drop it entirely when it just *is* the namespace.
  const segs =
    compSeg && compSeg.toLowerCase() !== ns.toLowerCase()
      ? [ns, compSeg, leaf]
      : [ns, leaf];
  let newKey = `${segs.join('.')}.${suffix}`;
  // A leaf identical to its suffix ("label.label") adds nothing.
  newKey = newKey.replace(new RegExp(`\\.${suffix}\\.${suffix}$`), `.${suffix}`);

  map[key] = newKey;
  // Remember the parts so the leaf can be dropped later where it carries no information.
  parts[key] = { ns, comp: compSeg, leaf, suffix };
  meta[key] = {
    prose: true,
    mechanical: false,
    shared,
    sites: recs.length,
    plural: pluralBases.has(key),
    interpolations: r.interpolations,
    files: [...new Set(recs.map((x) => x.file))],
  };
}

// en.json keys with no call site still need renaming (language/*, timestamp/*).
for (const k of Object.keys(en).map(bare)) {
  if (map[k]) continue;
  const mech = MECHANICAL.find((m) => m.re.test(k));
  if (mech) {
    map[k] = mech.to(k.match(mech.re));
    meta[k] = { prose: mech.prose, mechanical: true, sites: 0 };
  } else {
    review.push({ key: k, newKey: null, why: 'no call site and no mechanical rule' });
  }
}

// For copy that is a whole sentence the leaf is a lossy re-encoding of the sentence and adds
// nothing ("poll.endPollAlert.wantEndPollNow.description"). Where `<ns>.<comp>.<suffix>` is
// already unique, drop the leaf and let the component + role name the key.
{
  const tripleCount = {};
  for (const [key, p] of Object.entries(parts)) {
    if (!p.comp) continue;
    const triple = `${p.ns}.${p.comp}.${p.suffix}`;
    tripleCount[triple] = (tripleCount[triple] ?? 0) + 1;
    parts[key].triple = triple;
  }
  for (const [key, p] of Object.entries(parts)) {
    if (!p.triple || tripleCount[p.triple] !== 1) continue;
    // Judge by the original copy, not the derived leaf: a short label ("Voice message
    // deleted") still needs its leaf, a full sentence does not.
    if (words(key.replace(/^aria\//, '')).length < 6) continue;
    map[key] = p.triple;
  }
}

// Two old keys can land on the same new key because the leaf is derived from the copy with
// interpolation placeholders stripped ("Animated GIF" vs "Animated GIF: {{ title }}").
// Disambiguate by folding the interpolation variables into the key, which is also the more
// descriptive name; fall back to a numeric suffix only if that is still not unique.
const groupByNewKey = () => {
  const rev = new Map();
  for (const [oldK, newK] of Object.entries(map)) {
    if (!rev.has(newK)) rev.set(newK, []);
    rev.get(newK).push(oldK);
  }
  return rev;
};

for (const [, olds] of groupByNewKey()) {
  if (olds.length < 2) continue;
  for (const oldK of olds) {
    const vars = (meta[oldK]?.interpolations ?? []).filter((v) => v !== 'count');
    if (!vars.length) continue; // the bare variant keeps the short key
    const parts = map[oldK].split('.');
    const suffix = parts.pop();
    map[oldK] = [
      ...parts,
      `with${vars.map((v) => v[0].toUpperCase() + v.slice(1)).join('And')}`,
      suffix,
    ].join('.');
  }
}

for (const [, olds] of groupByNewKey()) {
  if (olds.length < 2) continue;
  olds.slice(1).forEach((oldK, i) => {
    const parts = map[oldK].split('.');
    const suffix = parts.pop();
    map[oldK] = [...parts, String(i + 2), suffix].join('.');
  });
}

const collisions = [...groupByNewKey().entries()].filter(([, v]) => v.length > 1);

// Emit sorted by new key so the file reads as a browsable table and diffs stay stable.
const entries = Object.entries(map).sort((a, b) => a[1].localeCompare(b[1]));
const keys = {};
for (const [oldKey, newKey] of entries) {
  const m = meta[oldKey] ?? {};
  keys[oldKey] = {
    key: newKey,
    // `prose: false` means the value is a formatter expression or plumbing, not English copy,
    // so the codemod must NOT add an inline default for it.
    prose: m.prose !== false,
    ...(m.plural ? { plural: true } : {}),
    ...(m.shared ? { shared: true } : {}),
  };
}

fs.writeFileSync(
  OUT,
  JSON.stringify(
    {
      $comment:
        'Migration table: natural-language translation key -> namespaced key. Generated by ' +
        'scripts/i18n-migration/generate-key-map.mjs and reviewed by hand. Integrators who ' +
        'passed translationsForLanguage/registerTranslation dictionaries keyed on the old ' +
        'strings should use this to rename their keys.',
      count: entries.length,
      keys,
    },
    null,
    2,
  ) + '\n',
);
if (collisions.length || review.length) {
  fs.writeFileSync(
    OUT.replace(/\.json$/, '.report.json'),
    JSON.stringify({ collisions, review }, null, 2) + '\n',
  );
}

console.log('mapped keys:      ', Object.keys(map).length);
console.log('collisions:       ', collisions.length);
console.log('needs review:     ', review.length);
console.log('longest new key:  ', Math.max(...Object.values(map).map((k) => k.length)));
if (collisions.length) {
  console.log('\n--- COLLISIONS ---');
  for (const [newK, olds] of collisions) {
    console.log(`  ${newK}`);
    olds.forEach((o) => console.log(`      <- ${JSON.stringify(o)}`));
  }
}
if (review.length) {
  console.log('\n--- REVIEW ---');
  review.forEach((r) =>
    console.log(
      `  ${JSON.stringify(r.key)} :: ${r.why}${r.namespaces ? ' ' + r.namespaces.join(',') : ''}`,
    ),
  );
}
