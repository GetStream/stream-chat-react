import {
  getTokenizedSuggestionDisplayName,
  type MemberFilters,
  type MemberSort,
  MentionsSearchSource,
  type UserResponse,
  type UserSuggestion,
} from 'stream-chat';

import { getMemberNickname } from './nicknameData';

const normalize = (value: string | undefined) => (value ?? '').toLowerCase();

/**
 * Mention autocomplete that matches on the channel nickname as well as the username, and shows
 * the nickname in the dropdown — on both the local and the server-side search paths.
 *
 * Every override here replaces a public arrow-function field on `MentionsSearchSource`; a subclass
 * field of the same name wins, because subclass field initializers run after `super()` and the base
 * constructor never calls these (so there is no ordering hazard). `resetState` is the exception —
 * it is a prototype method, overridden normally and chained with `super`.
 *
 * `getUserSuggestionsPage` dispatches through `this.searchMembersLocally` / `this.queryMembers`,
 * which is why that caller needs no changes.
 */
export class NicknameMentionsSearchSource extends MentionsSearchSource {
  /**
   * Nicknames harvested from server-side `queryMembers` responses, keyed by user id.
   *
   * Needed because the base `queryMembers` maps each member down to `member.user`, dropping the
   * member-level custom fields — so for a member the client has not loaded locally, the nickname
   * we just matched on would otherwise be unavailable when building the suggestion.
   */
  private nicknamesByUserId = new Map<string, string>();

  /** Local member state first (always current), then whatever the last query returned. */
  private resolveNickname = (userId: string) =>
    getMemberNickname(this.channel, userId) ?? this.nicknamesByUserId.get(userId);

  private resolveDisplayName = (user: UserResponse) =>
    this.resolveNickname(user.id) ?? user.name ?? user.id;

  /**
   * Local (in-memory) member search — the path taken while the channel has fewer than 100 members,
   * i.e. while `channel.state.members` is known to hold everyone.
   *
   * The base implementation matches `user.name` and `user.id` (plus a Levenshtein fallback). This
   * one adds the member's `nickname`.
   */
  searchMembersLocally = (searchQuery: string) => {
    const query = normalize(searchQuery);
    const ownUserId = this.client.userID;

    return this.getMembersAndWatchers()
      .filter((user) => {
        if (user.id === ownUserId) return false;
        if (!query) return true;

        return (
          normalize(getMemberNickname(this.channel, user.id)).includes(query) ||
          normalize(user.name).includes(query) ||
          normalize(user.id).includes(query)
        );
      })
      .sort((left, right) =>
        this.resolveDisplayName(left).localeCompare(this.resolveDisplayName(right)),
      );
  };

  /**
   * Server-side member search — the path taken once the channel has 100+ members and
   * `channel.state.members` can no longer be trusted to hold everyone.
   *
   * The API *does* support `$autocomplete` on a custom member field: `{ nickname: { $autocomplete } }`
   * and an `$or` combining it with `name` both work (verified against the live endpoint). The
   * base implementation's `// autocomplete possible only for name` comment is wrong.
   *
   * Two details this has to get right:
   *  - the base reads a *static* `memberFilters` field, which cannot embed the per-keystroke
   *    query — overriding the method is the only way to get a dynamic filter;
   *  - `sort` here is a key/value map (`{ user_id: 1 }`), not `{ field, direction }`. Passing the
   *    latter yields `sort must contain at maximum 1 item`, because it counts object keys.
   *
   * An integrator-supplied `memberFilters` still wins, matching base behaviour.
   */
  prepareQueryMembersParams = (searchQuery: string, offset = 0) => ({
    filters:
      this.memberFilters ??
      ({
        $or: [
          { name: { $autocomplete: searchQuery } },
          { nickname: { $autocomplete: searchQuery } },
        ],
      } as unknown as MemberFilters),
    options: { ...this.searchOptions, limit: this.pageSize, offset },
    sort: [{ user_id: 1 }] as unknown as MemberSort,
  });

  /**
   * Same request the base makes, but the member-level `nickname` is captured on the way through
   * before the response is flattened to plain users.
   */
  queryMembers = async (searchQuery: string, offset = 0) => {
    const { filters, options, sort } = this.prepareQueryMembersParams(
      searchQuery,
      offset,
    );
    const response = await this.channel.queryMembers(filters, sort, options);

    response.members.forEach((member) => {
      const userId = member.user_id ?? member.user?.id;
      const nickname = typeof member.nickname === 'string' ? member.nickname.trim() : '';

      if (userId && nickname) this.nicknamesByUserId.set(userId, nickname);
    });

    return response.members.map((member) => member.user) as UserResponse[];
  };

  resetState() {
    // Guarded: the base constructor may reach this before the field initializer has run.
    this.nicknamesByUserId?.clear();
    super.resetState();
  }

  /**
   * Turns a matched user into the suggestion the dropdown renders.
   *
   * Setting `name` to the nickname does double duty: it is what the dropdown displays, and the
   * composer inserts `@${suggestion.name || suggestion.id}` — so the textarea gets `@nickname`
   * too.
   *
   * It is also load-bearing for correctness: the composition middleware only keeps a mention in
   * `mentioned_users` when `entity.id` or `entity.name` actually appears in the text. Leave `name`
   * as the username here and the mention is silently dropped — no error, no notification.
   */
  toUserSuggestion = (
    user: UserResponse,
    searchToken = this.searchQuery,
  ): UserSuggestion => {
    const displayName = this.resolveDisplayName(user);

    return {
      ...user,
      mentionType: 'user',
      name: displayName,
      ...getTokenizedSuggestionDisplayName({ displayName, searchToken }),
    };
  };
}
