// Shape of the vendored emoji dataset (a snapshot of `@emoji-mart/data`'s native
// set). Kept structurally identical to the upstream data so that `mapEmojiMartData`
// and any consumer relying on the emoji-mart data shape keep working unchanged.

export type EmojiDataSkin = {
  native: string;
  unified: string;
};

export type EmojiDataEmoji = {
  id: string;
  keywords: string[];
  name: string;
  skins: EmojiDataSkin[];
  version: number;
  emoticons?: string[];
};

export type EmojiDataCategory = {
  emojis: string[];
  id: string;
};

export type EmojiData = {
  aliases: Record<string, string>;
  categories: EmojiDataCategory[];
  emojis: Record<string, EmojiDataEmoji>;
};
