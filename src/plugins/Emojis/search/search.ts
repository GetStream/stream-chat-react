import type { SearchableEmoji } from './buildEmojiSearchData';

export type RunSearchOptions = {
  maxResults?: number;
};

/**
 * Ranked emoji search replicating emoji-mart's `SearchIndex.search` (module.js):
 * lowercase the query, turn the first `word-` into `word ` (space), split on
 * whitespace/`|`/`,`, dedupe, then AND-intersect the pool across words — scoring
 * each emoji by the position of `,<word>` in its haystack. Lower score (earlier
 * match) ranks first; an exact id match scores 0; ties break by `id.localeCompare`.
 *
 * Returns `null` for an empty query (parity with emoji-mart), an empty array when
 * the query yields no usable words, otherwise the ranked matches capped at
 * `maxResults` (default 90).
 */
export const runSearch = (
  index: SearchableEmoji[],
  value: string,
  { maxResults = 90 }: RunSearchOptions = {},
): SearchableEmoji[] | null => {
  if (!value || !value.trim().length) return null;

  const words = value
    .toLowerCase()
    .replace(/(\w)-/, '$1 ')
    .split(/[\s|,]+/)
    .filter((word, position, all) => word.trim() && all.indexOf(word) === position);

  if (!words.length) return [];

  let pool = index;
  let results: SearchableEmoji[] = [];
  let scores: Record<string, number> = {};

  for (const word of words) {
    if (!pool.length) break;
    results = [];
    scores = {};
    for (const emoji of pool) {
      if (!emoji.search) continue;
      const score = emoji.search.indexOf(`,${word}`);
      if (score === -1) continue;
      results.push(emoji);
      scores[emoji.id] = (scores[emoji.id] ?? 0) + (emoji.id === word ? 0 : score + 1);
    }
    pool = results;
  }

  if (results.length < 2) return results;

  results.sort((a, b) => {
    const aScore = scores[a.id];
    const bScore = scores[b.id];
    if (aScore === bScore) return a.id.localeCompare(b.id);
    return aScore - bScore;
  });

  return results.length > maxResults ? results.slice(0, maxResults) : results;
};
