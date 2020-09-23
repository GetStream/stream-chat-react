import Emoji from 'emoji-mart/dist-modern/components/emoji/nimble-emoji';
import EmojiPicker from 'emoji-mart/dist-modern/components/picker/nimble-picker';
import EmojiIndex from 'emoji-mart/dist-modern/utils/emoji-index/nimble-emoji-index';
import {
  commonEmoji,
  defaultMinimalEmojis,
  emojiSetDef,
} from '../context/EmojiContext';
import emojiData from '../stream-emoji.json';

export const emojiMockConfig = {
  emojiData,
  EmojiPicker,
  Emoji,
  EmojiIndex,
  defaultMinimalEmojis,
  commonEmoji,
  emojiSetDef,
};
