import type {
  SearchSourceOptions,
  SearchSourceType,
  TextComposerMiddlewareOptions,
  TextComposerMiddlewareParams,
  TextComposerSuggestion,
} from 'stream-chat';
import {
  BaseSearchSource,
  getTriggerCharWithToken,
  insertItemWithTrigger,
  replaceWordWithEntity,
} from 'stream-chat';
import mergeWith from 'lodash.mergewith';
import type {
  EmojiSearchIndex,
  EmojiSearchIndexResult,
} from '../../../components/MessageInput';

class EmojiSearchSource<
  T extends TextComposerSuggestion<EmojiSearchIndexResult>,
> extends BaseSearchSource<T> {
  readonly type: SearchSourceType = 'emoji';
  private emojiSearchIndex: EmojiSearchIndex;

  constructor(emojiSearchIndex: EmojiSearchIndex, options?: SearchSourceOptions) {
    super(options);
    this.emojiSearchIndex = emojiSearchIndex;
  }

  async query(searchQuery: string) {
    if (searchQuery.length === 0 || searchQuery.charAt(0).match(/[^a-zA-Z0-9+-]/)) {
      return { items: [] as T[], next: null };
    }
    const emojis = (await this.emojiSearchIndex.search(searchQuery)) ?? [];

    // emojiIndex.search sometimes returns undefined values, so filter those out first
    return {
      items: emojis
        .filter(Boolean)
        .slice(0, 7)
        .map(({ id, name, native, skins = [] }) => {
          const [firstSkin] = skins;

          return {
            id,
            name,
            native: native ?? firstSkin.native,
          };
        }) as T[],
      next: null, // todo: generate cursor
    };
  }

  protected filterQueryResults(items: T[]): T[] | Promise<T[]> {
    return items;
  }
}

const DEFAULT_OPTIONS: TextComposerMiddlewareOptions = { minChars: 1, trigger: ':' };

/**
 * TextComposer middleware for mentions
 * Usage:
 *
 *  const textComposer = new TextComposer(options);
 *
 *  textComposer.use(new createTextComposerEmojiMiddleware(emojiSearchIndex, {
 *   minChars: 2
 *  }));
 *
 * @param emojiSearchIndex
 * @param {{
 *     minChars: number;
 *     trigger: string;
 *   }} options
 * @returns
 */
export const createTextComposerEmojiMiddleware = <
  T extends EmojiSearchIndexResult = EmojiSearchIndexResult,
>(
  emojiSearchIndex: EmojiSearchIndex,
  options?: Partial<TextComposerMiddlewareOptions>,
) => {
  const finalOptions = mergeWith(DEFAULT_OPTIONS, options ?? {});
  const emojiSearchSource = new EmojiSearchSource(emojiSearchIndex);
  emojiSearchSource.activate();

  return {
    id: finalOptions.trigger,
    onChange: async ({ input, nextHandler }: TextComposerMiddlewareParams<T>) => {
      const { state } = input;
      if (!state.selection) return nextHandler(input);

      const lastToken = getTriggerCharWithToken(
        finalOptions.trigger,
        state.text.slice(0, state.selection.end),
      );

      if (!lastToken || lastToken.length < finalOptions.minChars) {
        return nextHandler(input);
      }

      const textWithReplacedWord = await replaceWordWithEntity({
        caretPosition: state.selection.end,
        getEntityString: async (word: string) => {
          const { items } = await emojiSearchSource.query(word);

          const emoji = items
            .filter(Boolean)
            .slice(0, 10)
            .find(({ emoticons }) => !!emoticons?.includes(word));

          if (!emoji) return null;

          const [firstSkin] = emoji.skins ?? [];

          return emoji.native ?? firstSkin.native;
        },
        text: state.text,
      });

      if (textWithReplacedWord !== state.text) {
        return {
          state: {
            ...state,
            suggestions: undefined,
            text: textWithReplacedWord,
          },
          stop: true, // Stop other middleware from processing '@' character
        };
      }

      return {
        state: {
          ...state,
          suggestions: {
            query: lastToken.slice(1),
            searchSource: emojiSearchSource,
            trigger: finalOptions.trigger,
          },
        },
        stop: true, // Stop other middleware from processing '@' character
      };
    },
    onSuggestionItemSelect: ({
      input,
      nextHandler,
      selectedSuggestion,
    }: TextComposerMiddlewareParams<T>) => {
      const { state } = input;
      if (!selectedSuggestion || state.suggestions?.trigger !== finalOptions.trigger)
        return nextHandler(input);

      return Promise.resolve({
        state: {
          ...state,
          ...insertItemWithTrigger({
            insertText: `${'native' in selectedSuggestion ? selectedSuggestion.native : ''} `,
            selection: state.selection,
            text: state.text,
            trigger: finalOptions.trigger,
          }),
          suggestions: undefined, // Clear suggestions after selection
        },
      });
    },
  };
};
