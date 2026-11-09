/**
 * Seeds into Stream's public demo app, from src/base/demo-data.json, the cookbook's users,
 * channels, members, messages and their custom fields, the users a message mentions, attachments, thread replies, pins,
 * receipts, members' read positions, the current user's channel and thread read state, and the
 * channels the current user pinned or archived, channels another cast member created with the
 * current user's invite still pending, the current user's reminders and messages saved for
 * later, and the current user's unsent drafts in channels and threads. Running it again brings
 * the app back in line with the file: missing channels, members, invites and messages are added (existing messages are looked up
 * first, so only the missing ones are sent), changed names, texts and mentions are updated, and
 * nothing that already matches is touched, so a re-run against unchanged data changes nothing.
 *
 *   yarn workspace @stream-io/stream-chat-react-cookbook seed
 */
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { nsToMs, StreamChat } from 'stream-chat';

const readJson = async (url) => JSON.parse(await readFile(url, 'utf8'));
const demoData = await readJson(new URL('../src/base/demo-data.json', import.meta.url));

// A recipe that needs data of its own keeps it in src/recipes/<group>/<recipe>/demo-data.json, in
// the same shape (`users` and `channels`); it is seeded together with the base data.
const recipesDir = new URL('../src/recipes/', import.meta.url);
for (const group of await readdir(recipesDir, { withFileTypes: true })) {
  if (!group.isDirectory()) continue;
  for (const recipe of await readdir(new URL(`${group.name}/`, recipesDir), {
    withFileTypes: true,
  })) {
    const file = new URL(`${group.name}/${recipe.name}/demo-data.json`, recipesDir);
    if (!recipe.isDirectory() || !existsSync(file)) continue;
    const extra = await readJson(file);
    for (const user of extra.users ?? []) {
      if (!demoData.users.some(({ id }) => id === user.id)) demoData.users.push(user);
    }
    demoData.channels.push(...(extra.channels ?? []));
  }
}

const fetchToken = async (userId) => {
  const url = new URL('https://pronto.getstream.io/api/auth/create-token');
  url.searchParams.set('environment', demoData.tokenEnvironment);
  url.searchParams.set('user_id', userId);
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Token request for ${userId} failed: ${response.status}`);
  return (await response.json()).token;
};

const isAlreadyExists = (error) =>
  /already exists/i.test(String(error?.message ?? error));

// One connected client per demo user. Connecting also creates the user with its name.
const clients = new Map();

try {
  for (const user of demoData.users) {
    const client = new StreamChat(demoData.apiKey, {
      client: { allowServerSideConnect: true },
    });
    clients.set(user.id, client);
    await client.connectUser(user, () => fetchToken(user.id));
    console.log(`user ${user.id} (${user.name})`);
  }

  const owner = clients.get(demoData.currentUserId);

  for (const channelData of demoData.channels) {
    // `createdBy` creates the channel as another cast member, for a channel the current user
    // doesn't belong to, such as one they're only invited to. Every other channel is the current
    // user's. An existing channel keeps its creator.
    if (channelData.createdBy && !clients.has(channelData.createdBy))
      console.warn(
        `  createdBy ${channelData.createdBy} of ${channelData.id} skipped: not a cast member`,
      );
    const creator = clients.get(channelData.createdBy) ?? owner;
    const channel = await creator
      .channel('messaging', channelData.id, {
        // Custom fields such as the name go under `custom`; the SDK reads `data.custom.name`.
        ...(channelData.name && { custom: { name: channelData.name } }),
        members: channelData.members.map((user_id) => ({ user_id })),
      })
      .watch();
    console.log(`channel ${channelData.id}`);

    // An existing channel keeps its data and members, so reconcile both with the file.
    if (channelData.name && channel.data?.custom?.name !== channelData.name) {
      await channel.updatePartial({ set: { 'custom.name': channelData.name } });
      console.log(`  name → ${channelData.name}`);
    }
    const { members } = channel.state.getLatestValue();
    const missingMembers = channelData.members.filter((id) => !members[id]);
    if (missingMembers.length) {
      await channel.addMembers({ members: missingMembers });
      console.log(`  members + ${missingMembers.join(', ')}`);
    }

    // `invites` lists users the creator invited and who haven't answered yet, for a recipe that
    // shows pending invites. A user with a pending invite is left alone, so a re-run changes
    // nothing. A user who accepted or declined is removed and invited again, which makes the invite
    // pending once more. A user who is also in `members`, or is the creator, is skipped with a
    // warning: they would join the channel without an invite.
    for (const userId of channelData.invites ?? []) {
      if (channelData.members.includes(userId) || clients.get(userId) === creator) {
        console.warn(
          `  invite of ${userId} skipped: already a member of ${channelData.id}`,
        );
        continue;
      }
      if (!clients.has(userId)) {
        console.warn(`  invite of ${userId} skipped: not a cast member`);
        continue;
      }
      const member = members[userId];
      const isPending =
        member?.invited && !member.invite_accepted_at && !member.invite_rejected_at;
      if (isPending) continue;
      if (member) await channel.removeMembers({ members: [userId] });
      await channel.inviteMembers({ members: [userId] });
      console.log(`  invited ${userId}`);
    }

    // The demo app allows each user only a few messages a minute, and a send that fails because
    // the message already exists still counts. So the messages already in the channel, thread
    // replies included, are looked up by id first, in batches of 100, and only the missing ones
    // are sent.
    const storedById = new Map();
    const messageIds = channelData.messages.map(({ id }) => id);
    for (let start = 0; start < messageIds.length; start += 100) {
      const { messages: stored } = await channel.getMessagesById(
        messageIds.slice(start, start + 100),
      );
      for (const storedMessage of stored) storedById.set(storedMessage.id, storedMessage);
    }

    // Messages go out in order, each from its author, so the list reads as a conversation.
    // Receipts are for the main list, so the last message that isn't a thread reply is kept.
    let lastSent;
    for (const message of channelData.messages) {
      const author = clients.get(message.user);
      let sent = storedById.get(message.id);
      if (!sent) {
        try {
          sent = (
            await author.channel('messaging', channelData.id).sendMessage({
              message: {
                id: message.id,
                text: message.text,
                ...(message.parent && { parent_id: message.parent }),
              },
            })
          ).message;
          console.log(`  message ${message.id}`);
        } catch (error) {
          // The id is taken outside this channel, or the lookup missed it: read it as it is.
          if (!isAlreadyExists(error)) throw error;
          sent = (await author.getMessage({ id: message.id })).message;
        }
      }
      // An existing message whose text differs from the file gets the file's text.
      if (sent.text !== message.text) {
        await author.updateMessagePartial(
          { id: message.id },
          { set: { text: message.text } },
        );
        console.log(`  text of ${message.id} updated`);
      }

      // `custom` holds a message's custom fields, for example `ai_generated` on an assistant's
      // reply. They are set after it's sent, by its author, and only the ones whose stored value
      // differs, so a re-run changes nothing. A message without `custom` keeps whatever it has.
      // A key that names a top-level field (`text`, `id`, `user`) would overwrite that field, so
      // it is skipped with a warning.
      const reservedKeys = ['text', 'id', 'user'];
      const changedCustom = Object.entries(message.custom ?? {}).filter(
        ([key, value]) => {
          if (reservedKeys.includes(key)) {
            console.warn(
              `  custom field "${key}" of ${message.id} skipped: it's a reserved field`,
            );
            return false;
          }
          return (
            JSON.stringify(sent.custom?.[key] ?? sent[key]) !== JSON.stringify(value)
          );
        },
      );
      if (changedCustom.length) {
        await author.updateMessagePartial(
          { id: message.id },
          {
            set: Object.fromEntries(
              changedCustom.map(([key, value]) => [`custom.${key}`, value]),
            ),
          },
        );
        console.log(`  custom fields of ${message.id} set`);
      }

      // `mentions` lists the ids of the users the text mentions (`@Cleo`), for a recipe that shows
      // mentions; the server stores them as `mentioned_users`. The demo app refuses a new message
      // with mentions, so they are set after it's sent, by its author, and only when the stored ids
      // differ, so a re-run changes nothing. A message without `mentions` keeps whatever it has.
      // An id that isn't a cast member and a member of the channel is skipped with a warning.
      const mentions = (message.mentions ?? []).filter((userId) => {
        const known = clients.has(userId) && channelData.members.includes(userId);
        if (!known)
          console.warn(
            `  mention of ${userId} in ${message.id} skipped: not a cast member and a member of ${channelData.id}`,
          );
        return known;
      });
      const sameIds = (a, b) =>
        JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
      const mentionedIds = (sent.mentioned_users ?? []).map(({ id }) => id);
      if (message.mentions && !sameIds(mentionedIds, mentions)) {
        await author.updateMessagePartial(
          { id: message.id },
          { set: { mentioned_users: mentions } },
        );
        console.log(`  mentions of ${message.id} set`);
      }

      // The demo app refuses uploads, so a message's attachments (image URLs and the like) are set
      // on it after it's sent, by its author. Compared by value, so a re-run changes nothing.
      // The server adds fields of its own to each attachment, so only the fields the file sets are compared.
      const sameAttachments = (stored = []) =>
        stored.length === message.attachments.length &&
        message.attachments.every((attachment, index) =>
          Object.entries(attachment).every(
            ([key, value]) =>
              // Fields the attachment type doesn't define come back under `custom`.
              JSON.stringify(stored[index]?.[key] ?? stored[index]?.custom?.[key]) ===
              JSON.stringify(value),
          ),
        );
      if (message.attachments && !sameAttachments(sent.attachments)) {
        await author.updateMessagePartial(
          { id: message.id },
          { set: { attachments: message.attachments } },
        );
        console.log(`  attachments of ${message.id} set`);
      }

      // Only the author may pin their message in the demo app. An existing pin keeps its date,
      // so a screenshot showing it doesn't change on every seed.
      if (message.pinnedBy && !sent.pinned) {
        await clients.get(message.pinnedBy).pinMessage({ id: message.id });
        console.log(`  pinned ${message.id}`);
      }
      if (!message.parent) lastSent = sent;
    }

    // `reminderForCurrentUser` gives a message a reminder of the current user's, for a recipe that
    // lists saved messages and reminders: `{}` saves the message for later with no time,
    // `{ remindAt: <ISO time> }` sets a fixed time, and `{ remindAt: "+2m" }` a time that many
    // minutes after the run that creates it. The server refuses a time in the past, so a relative
    // time is how a reminder becomes overdue: it is created once and then kept, like a pin's date,
    // so its label stays the same on later runs. Reminders are looked up first and set only when
    // one is missing or differs from the file (deleted and created again, which also turns a
    // reminder into a saved message and back), so a re-run changes nothing. A message without the
    // field keeps whatever reminder it has. A channel type with reminders turned off refuses them
    // (`user_message_reminders`), which is reported once per channel and skipped.
    const withReminder = channelData.messages.filter(
      (message) => message.reminderForCurrentUser,
    );
    if (withReminder.length && !channelData.members.includes(demoData.currentUserId)) {
      console.warn(
        `  reminders skipped: ${demoData.currentUserId} is not a member of ${channelData.id}`,
      );
    } else if (withReminder.length) {
      const { reminders: storedReminders } = await owner.queryReminders({
        filter: { message_id: { $in: withReminder.map(({ id }) => id) } },
      });
      for (const message of withReminder) {
        const { remindAt } = message.reminderForCurrentUser;
        const relativeMinutes = remindAt?.match(/^\+(\d+)m$/)?.[1];
        const stored = storedReminders.find(
          ({ message_id }) => message_id === message.id,
        );
        const storedMs = stored?.remind_at != null ? nsToMs(stored.remind_at) : null;
        const isInLine = relativeMinutes
          ? storedMs !== null
          : storedMs === (remindAt ? Date.parse(remindAt) : null);
        if (stored && isInLine) continue;
        const wantedMs = relativeMinutes
          ? Date.now() + Number(relativeMinutes) * 60 * 1000
          : remindAt && Date.parse(remindAt);
        try {
          if (stored) await owner.deleteReminder({ message_id: message.id });
          await owner.createReminder(
            { message_id: message.id },
            wantedMs ? { remind_at: new Date(wantedMs) } : {},
          );
          console.log(`  reminder of ${message.id} ${remindAt ?? 'saved for later'}`);
        } catch (error) {
          console.warn(`  reminders skipped in ${channelData.id}: ${error.message}`);
          break;
        }
      }
    }

    // A member listed in both `readBy` and `readUpTo` would be marked read by one step and unread
    // by the other on every run, and the current user's read state is set further down, so both
    // are left out with a warning. That keeps a re-run from changing anything.
    const readUpToIds = Object.keys(channelData.readUpTo ?? {});
    const readStateConflict = (userId, step) => {
      if (userId === demoData.currentUserId) {
        console.warn(
          `  ${step} by ${userId} skipped: the seed sets the current user's own read state (read, or unreadFrom)`,
        );
        return true;
      }
      if ((channelData.readBy ?? []).includes(userId) && readUpToIds.includes(userId)) {
        console.warn(
          `  ${step} by ${userId} skipped: in both readBy and readUpTo of ${channelData.id}`,
        );
        return true;
      }
      return false;
    };

    // Receipts for a recipe that shows them: `readBy` users read the channel up to its last
    // message, `deliveredTo` users only received it. Each is marked once, as that user, so a re-run
    // keeps the times a screenshot shows. A channel without a message in its main list has nothing
    // to mark.
    const receipts = [
      ...(channelData.readBy ?? [])
        .filter((id) => !readStateConflict(id, 'read'))
        .map((id) => [id, 'read']),
      ...(channelData.deliveredTo ?? []).map((id) => [id, 'delivered']),
    ];
    if (receipts.length && !lastSent)
      console.warn(`  receipts skipped: ${channelData.id} has no message to mark`);
    for (const [userId, kind] of lastSent ? receipts : []) {
      const isMember = channelData.members.includes(userId) && clients.has(userId);
      if (!isMember) {
        console.warn(`  ${kind} by ${userId} skipped: not a member of ${channelData.id}`);
        continue;
      }
      const memberChannel = clients.get(userId).channel('messaging', channelData.id);
      await memberChannel.watch();
      const own = memberChannel.state.read[userId];
      const reached = kind === 'read' ? own?.last_read : own?.last_delivered_at;
      if (reached && reached >= lastSent.created_at) continue;
      if (kind === 'read') await memberChannel.markRead();
      else
        await clients.get(userId).markChannelsDelivered({
          latest_delivered_messages: [{ cid: memberChannel.cid, id: lastSent.id }],
        });
      console.log(`  ${kind} by ${userId}`);
    }

    // `readUpTo` maps a member to the last main-list message they've read, for a recipe that shows
    // who read how far. As that member, the channel is marked unread from the next main-list
    // message, or read when it's the last one. Like the receipts above, it's marked only when the
    // member's read state differs: the last read message id, or for the last message the time of the
    // last read, so a re-run changes nothing.
    const mainList = channelData.messages.filter((message) => !message.parent);
    for (const [userId, messageId] of Object.entries(channelData.readUpTo ?? {})) {
      if (readStateConflict(userId, 'read up to')) continue;
      const isMember = channelData.members.includes(userId) && clients.has(userId);
      if (!isMember) {
        console.warn(
          `  read up to by ${userId} skipped: not a member of ${channelData.id}`,
        );
        continue;
      }
      const readIndex = mainList.findIndex(({ id }) => id === messageId);
      if (readIndex === -1) {
        console.warn(
          `  read up to by ${userId} skipped: ${messageId} is not a main-list message of ${channelData.id}`,
        );
        continue;
      }
      const nextMessage = mainList[readIndex + 1];
      const memberChannel = clients.get(userId).channel('messaging', channelData.id);
      await memberChannel.watch();
      const own = memberChannel.state.read[userId];
      const isReadUpTo = nextMessage
        ? own?.unread_messages > 0 && own.last_read_message_id === messageId
        : !!own?.last_read && own.last_read >= lastSent.created_at;
      if (isReadUpTo) continue;
      if (nextMessage) await memberChannel.markUnread({ message_id: nextMessage.id });
      else await memberChannel.markRead();
      console.log(`  read up to ${messageId} by ${userId}`);
    }

    // The current user has read everything, so no badge depends on when the seed ran. A channel
    // with `unreadFrom` (a message id) is the exception: it stays unread from that message on, for
    // a recipe that shows unread state. A query returns no `first_unread_message_id`, so the check
    // is that the last read message is the one before it. It is marked only when that differs, so
    // a re-run changes nothing, and a run after the channel was read in the app marks it again.
    const unreadIndex = channelData.unreadFrom
      ? mainList.findIndex(({ id }) => id === channelData.unreadFrom)
      : -1;
    // On a channel another cast member created, `channel` is that member's, so the current user's
    // read state is left alone.
    if (creator !== owner) {
      if (channelData.unreadFrom)
        console.warn(`  unread from skipped: ${channelData.id} has createdBy`);
    } else if (channelData.unreadFrom && unreadIndex === -1) {
      console.warn(
        `  unread from skipped: ${channelData.unreadFrom} is not a main-list message of ${channelData.id}`,
      );
    } else if (channelData.unreadFrom) {
      const lastReadId = mainList[unreadIndex - 1]?.id;
      const ownRead = channel.state.read[demoData.currentUserId];
      const isUnreadFrom =
        ownRead?.unread_messages > 0 && ownRead.last_read_message_id === lastReadId;
      if (!isUnreadFrom) {
        await channel.markUnread({ message_id: channelData.unreadFrom });
        console.log(`  unread from ${channelData.unreadFrom}`);
      }
    } else {
      await channel.markRead().catch(() => undefined);
    }

    // A parent message with `unreadForCurrentUser` keeps its thread unread for the current user,
    // for a recipe that shows unread threads: opening a thread in the app marks it read on the
    // server. `Channel.markUnread({ thread_id })` marks only the thread's latest reply unread (the
    // server takes no message id with a thread id), so the thread ends up with one unread reply
    // whatever its history. It is marked only when the server counts a different number, so a
    // re-run changes nothing.
    const unreadThreadIds = channelData.messages
      .filter((message) => message.unreadForCurrentUser)
      .map(({ id }) => id);
    if (unreadThreadIds.length) {
      const { threads = [] } = await owner.unreadCounts();
      for (const threadId of unreadThreadIds) {
        const hasReplies = channelData.messages.some(({ parent }) => parent === threadId);
        if (!mainList.some(({ id }) => id === threadId) || !hasReplies) {
          console.warn(
            `  unread thread ${threadId} skipped: not a parent message with replies in ${channelData.id}`,
          );
          continue;
        }
        const unreadCount =
          threads.find(({ parent_message_id }) => parent_message_id === threadId)
            ?.unread_count ?? 0;
        if (unreadCount === 1) continue;
        // More than one unread reply: read the thread first, so only the latest one stays unread.
        if (unreadCount > 1) await channel.markRead({ thread_id: threadId });
        await channel.markUnread({ thread_id: threadId });
        console.log(`  thread ${threadId} unread`);
      }
    }

    // `pinnedForCurrentUser` and `archivedForCurrentUser` pin or archive the channel for the current
    // user, for a recipe that shows pinned and archived channels; a channel without them is neither.
    // Both live on the user's own membership, so they need the user to be a member. Each is changed
    // only when the membership differs, so a re-run keeps the pin date a sorted list shows.
    const membershipFlags = [
      ['pinned', channelData.pinnedForCurrentUser, 'pinned_at', 'pin', 'unpin'],
      [
        'archived',
        channelData.archivedForCurrentUser,
        'archived_at',
        'archive',
        'unarchive',
      ],
    ];
    // On a channel another cast member created, `channel` is that member's, so its membership
    // isn't the current user's and is left alone, like the read state above.
    const isOwnMember = channelData.members.includes(demoData.currentUserId);
    for (const [label, wanted, dateField, setMethod, unsetMethod] of membershipFlags) {
      if (creator !== owner) {
        if (wanted) console.warn(`  ${label} skipped: ${channelData.id} has createdBy`);
        continue;
      }
      const isSet = channel.state.membership?.[dateField] != null;
      if (!!wanted === isSet) continue;
      if (!isOwnMember) {
        console.warn(
          `  ${label} skipped: ${demoData.currentUserId} is not a member of ${channelData.id}`,
        );
        continue;
      }
      await channel[wanted ? setMethod : unsetMethod]();
      console.log(`  ${wanted ? label : `not ${label}`} for ${demoData.currentUserId}`);
    }

    // `draftsForCurrentUser` lists the current user's unsent drafts in the channel, for a recipe
    // that lists drafts: `{ text }` for the channel's own draft, with `parent` (a main-list message
    // id) for a thread's draft, and `quotedMessage` (a message id) for a draft that quotes one.
    // Drafts are per user, so they are saved as the current user, and only when the stored draft
    // differs, so a re-run keeps the time a screenshot shows. A channel or thread without an entry
    // keeps whatever draft it has. A refused draft is reported and skipped.
    for (const draft of channelData.draftsForCurrentUser ?? []) {
      const where = draft.parent ? `thread ${draft.parent}` : channelData.id;
      if (creator !== owner || !isOwnMember) {
        console.warn(`  draft in ${where} skipped: not the current user's own channel`);
        continue;
      }
      const unknownId = [draft.parent, draft.quotedMessage].find(
        (id) => id && !mainList.some((message) => message.id === id),
      );
      if (unknownId) {
        console.warn(
          `  draft in ${where} skipped: ${unknownId} is not a main-list message of ${channelData.id}`,
        );
        continue;
      }
      // A channel or thread without a draft answers with an error.
      const stored = await channel
        .getDraft({ parent_id: draft.parent })
        .then(({ draft: found }) => found)
        .catch(() => undefined);
      const isSame =
        stored?.message.text === draft.text &&
        (stored.message.quoted_message_id ?? undefined) === draft.quotedMessage;
      if (isSame) continue;
      try {
        await channel.createDraft({
          message: {
            text: draft.text,
            ...(draft.parent && { parent_id: draft.parent }),
            ...(draft.quotedMessage && { quoted_message_id: draft.quotedMessage }),
          },
        });
        console.log(`  draft in ${where} saved`);
      } catch (error) {
        console.warn(`  draft in ${where} skipped: ${error.message}`);
      }
    }
  }
} finally {
  for (const client of clients.values()) await client.disconnectUser();
}
