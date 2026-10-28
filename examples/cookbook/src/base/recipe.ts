import type { ComponentType, PropsWithChildren, ReactNode } from 'react';
import type { StreamChat } from 'stream-chat';
import type { ChatProps } from 'stream-chat-react';
import type { ChatViewProps, LayoutDescriptor } from 'stream-chat-react/slot-layout';
import type { SidePanelProps } from './SidePanel';

/**
 * What one recipe variant changes in the base app. Each `*.recipe.tsx` file under `src/recipes/`
 * default-exports one, and imports its own CSS, so only the selected recipe's styles load.
 */
export type RecipeConfig = {
  /** Replaces the SDK's `ChannelHeader` in the channel panel. */
  ChannelHeader?: ComponentType;
  /**
   * Replaces the SDK's `ChannelNavigation` in the base app's channels view. Ignored when
   * `views.channels` or `chatViewProps.views` replaces the view.
   */
  ChannelNavigation?: ComponentType;
  /**
   * Extra props for `Chat`, built once per client, for example a `searchController`. The base app
   * passes `client` and `theme` itself.
   */
  chatProps?: (client: StreamChat) => Partial<Omit<ChatProps, 'client' | 'theme'>>;
  /** Rendered inside `ChatView`, beside the active view, for code that must outlive view switches. */
  chatViewChildren?: ReactNode;
  /**
   * Props for `ChatView`: views, layouts, slot rules, navigation overrides, slot renderers. Each
   * one replaces the base app's, so `chatViewProps.views` and `chatViewProps.layouts` win over
   * `RecipeConfig.views` and `RecipeConfig.layouts`, which add to them.
   */
  chatViewProps?: Omit<ChatViewProps, 'children'>;
  /**
   * Layouts merged into the base app's by `id`: a new `id` adds a layout, and a base one's `id`
   * (`channels`) replaces it. Each view in `RecipeConfig.views` needs its layout here.
   */
  layouts?: LayoutDescriptor[];
  /**
   * Replaces the SDK's `MessageList` in the base app's channels view: the channel's and the
   * thread's alike, so both lists behave the same. Ignored when `views.channels` or
   * `chatViewProps.views` replaces the view.
   */
  MessageList?: ComponentType;
  /**
   * `false` turns off the base app's `?channel=` / `?thread=` opener, for a recipe that reads the
   * URL itself.
   */
  openFromUrl?: boolean;
  /**
   * Props for the base app's `SidePanel`, for example the `UserProfile` it renders a profile
   * with. Ignored when `views.channels` or `chatViewProps.views` replaces the channels view.
   */
  sidePanelProps?: SidePanelProps;
  /**
   * `false` leaves out the base app's channel paginator, for a recipe that registers its own on
   * `client.channelManager`, with `channelFilters` from `base/client` to show the same channels.
   */
  registerChannelPaginator?: boolean;
  /** The `theme` passed to `Chat`, for example `str-chat__theme-dark`. */
  theme?: string;
  /**
   * Views merged into the base app's by key: a new key adds a view beside the channels view, and
   * `channels` replaces it. Each view needs a layout with the same `id` in `RecipeConfig.layouts`,
   * and a way to switch to it, for example `ChatView.Selector` in `chatViewChildren`.
   */
  views?: ChatViewProps['views'];
  /**
   * Wraps `ChatView` inside `Chat` and `SidePanelProvider`, for example with `WithComponents`, so
   * what it renders can open the side panel.
   */
  Wrapper?: ComponentType<PropsWithChildren>;
};

type RecipeModule = { default: RecipeConfig };

// `src/recipes/<group>/<recipe>/<variant>.recipe.tsx` → id `<group>/<recipe>`, variant `<variant>`.
const recipeModules = import.meta.glob<RecipeModule>('../recipes/*/*/*.recipe.tsx');

const parseRecipePath = (path: string) => {
  const match = path.match(/\.\.\/recipes\/([^/]+\/[^/]+)\/([^/]+)\.recipe\.tsx$/);
  return match ? { id: match[1], variant: match[2] } : undefined;
};

export const listRecipes = () =>
  Object.keys(recipeModules)
    .map(parseRecipePath)
    .filter((entry): entry is { id: string; variant: string } => !!entry)
    .sort((a, b) => `${a.id}/${a.variant}`.localeCompare(`${b.id}/${b.variant}`));

/** Loads `?recipe=<group>/<recipe>&variant=<variant>`; the variant defaults to `default`. */
export const loadRecipe = async (
  id: string,
  variant = 'default',
): Promise<RecipeConfig | undefined> => {
  const load = recipeModules[`../recipes/${id}/${variant}.recipe.tsx`];
  return load ? (await load()).default : undefined;
};
