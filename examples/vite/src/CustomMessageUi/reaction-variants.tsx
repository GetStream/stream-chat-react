import {
  ReactionSelector,
  MessageReactions,
  type ReactionOptions,
} from 'stream-chat-react';

// ─── Custom Reaction Options (upvote/downvote) ───────────────────

export const customReactionOptionsUpvote: ReactionOptions = {
  quick: {
    arrow_up: {
      Component: () => <>⬆️</>,
      name: 'Up vote',
    },
    arrow_down: {
      Component: () => <>⬇️</>,
      name: 'Down vote',
    },
  },
  extended: {
    arrow_up: {
      Component: () => <>⬆️</>,
      name: 'Up vote',
    },
    arrow_down: {
      Component: () => <>⬇️</>,
      name: 'Down vote',
    },
    fire: {
      Component: () => <>🔥</>,
      name: 'Fire',
    },
  },
};

// ─── Segmented ReactionsList ─────────────────────────────────────

export const SegmentedReactionsList = (
  props: React.ComponentProps<typeof MessageReactions>,
) => <MessageReactions {...props} visualStyle='segmented' />;

// ─── Passthrough ReactionSelector (for custom handler demo) ──────

export const PassthroughReactionSelector = (
  props: React.ComponentProps<typeof ReactionSelector>,
) => <ReactionSelector {...props} />;
