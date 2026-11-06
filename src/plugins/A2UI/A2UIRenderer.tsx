import React, { type ComponentPropsWithoutRef, type ComponentType } from 'react';

import type { AIUIDocument } from '../AIComponents/GenerativeUI/AIUIDocument';
import type { AIUIHost } from '../AIComponents/GenerativeUI/AIUIHost';
import {
  type AIUIMediaURL,
  aiUIPublicMediaURL,
} from '../AIComponents/GenerativeUI/AIUIMedia';
import type { AIUIEngine, AIUIRenderer } from '../AIComponents/GenerativeUI/AIUIRenderer';
import {
  AIUIRuntimeLoader,
  AIUIRuntimeView,
} from '../AIComponents/GenerativeUI/AIUIRuntimeLoader';
import { A2UIPlaceholder } from './A2UIPlaceholder';
import { A2UI_DEFAULT_CATALOG_ID, A2UI_LEGACY_CATALOG_ID } from './catalogDocument';
import { A2UI_VERSION, a2uiSourceOf, supportsA2UIVersion } from './A2UIStream';
import { a2uiInstructions } from './A2UIInstructions';
// Types only: the runtime, with the A2UI packages, loads in the browser when a reply first
// shows A2UI.
import type { ReactA2uiComponentProps } from '@a2ui/react';
import type { A2UIReplyState, A2UIRuntime } from './runtime';

export { A2UI_DEFAULT_CATALOG_ID, A2UI_LEGACY_CATALOG_ID };

/** What went wrong in a reply's A2UI, as the A2UI specification reports it to an agent. */
export type A2UIError = {
  /** A code such as `VALIDATION_FAILED` or `EXPRESSION_ERROR`. */
  code: string;
  message: string;
  /** Where in the message it went wrong, as a JSON pointer. */
  path?: string;
  surfaceId?: string;
};

/** The components of A2UI's basic catalog, each of which an app can draw its own way or leave out. */
export type A2UIBasicComponentName =
  | 'AudioPlayer'
  | 'Button'
  | 'Card'
  | 'CheckBox'
  | 'ChoicePicker'
  | 'Column'
  | 'DateTimeInput'
  | 'Divider'
  | 'Icon'
  | 'Image'
  | 'List'
  | 'Modal'
  | 'Row'
  | 'Slider'
  | 'Tabs'
  | 'Text'
  | 'TextField'
  | 'Video';

/**
 * An app's view of one of the basic catalog's components, as `@a2ui/react` places it: with
 * `props` worked out from what the agent wrote, `buildChild` to place its children by id, and
 * the component's `context`.
 */
export type A2UIBasicComponent = ComponentType<
  ReactA2uiComponentProps<Record<string, unknown>>
>;

export type A2UIRendererOptions = {
  /**
   * The basic catalog's components to draw the app's way, by name, or `null` to leave one out
   * of the catalog and the agent's instructions, such as `{ Video: null }`.
   */
  basicComponents?: Partial<Record<A2UIBasicComponentName, A2UIBasicComponent | null>>;
  /**
   * The id the agent names the catalog with the app's components by. A surface naming the
   * basic catalog shows them too, and a surface naming none is made with this one.
   */
  catalogId?: string;
  /**
   * The icon font the page loads, such as `'Material Symbols Outlined'`, for the icons of A2UI's
   * Icon that neither `icons` nor Stream draws. Without one, such an icon shows nothing.
   */
  iconFont?: string;
  /**
   * The app's icons for the names A2UI's Icon takes, such as `shoppingCart`, over Stream's.
   * Stream draws about 30 of the 60 names.
   */
  icons?: Partial<Record<string, ComponentType<ComponentPropsWithoutRef<'svg'>>>>;
  /**
   * What the app tells the agent's model about writing its UI, such as when to answer with UI,
   * ahead of A2UI's own instructions in `capabilities`.
   */
  instructions?: string;
  /**
   * What an image, video or sound the agent links to loads: the URL, another, or `null` not to
   * load it. Public web links and the page's own site load by default (`aiUIPublicMediaURL`).
   */
  mediaUrl?: AIUIMediaURL;
  /**
   * Tells the app what went wrong in a reply's A2UI, such as a message that isn't JSON or a
   * component the catalog doesn't have, with the reply's id. The rest of the reply's UI still
   * shows. What is wrong with the renderer rather than a reply, such as an app's component that
   * can't join the catalog or a runtime that couldn't load, comes without an id. Logged by
   * default.
   */
  onError?: (error: A2UIError, messageId?: string) => void;
};

const reportA2UIError = (
  options: A2UIRendererOptions,
  error: A2UIError,
  messageId?: string,
) => {
  if (options.onError) options.onError(error, messageId);
  else console.error(`A reply's A2UI can't show: ${error.code} ${error.message}`, error);
};

/**
 * Shows the A2UI of one conversation. Each reply's surfaces are its own, kept for as long as
 * the host keeps the engine, so what the person entered survives scrolling.
 */
export class A2UIEngine implements AIUIEngine {
  readonly catalogId: string;
  readonly basicComponents: NonNullable<A2UIRendererOptions['basicComponents']>;
  readonly host: AIUIHost;
  readonly iconFont?: string;
  readonly icons?: A2UIRendererOptions['icons'];
  /** What an image, video or sound the agent links to loads. */
  readonly mediaURL: AIUIMediaURL;
  /** Loads the runtime, the A2UI packages, when a reply first shows A2UI. */
  readonly loader: AIUIRuntimeLoader<A2UIRuntime>;
  /** Each reply's surfaces, by the reply's id. */
  readonly replies = new Map<string, A2UIReplyState>();

  private readonly options: A2UIRendererOptions;

  constructor(host: AIUIHost, options: A2UIRendererOptions) {
    this.host = host;
    this.options = options;
    this.catalogId = options.catalogId ?? A2UI_DEFAULT_CATALOG_ID;
    this.basicComponents = options.basicComponents ?? {};
    this.iconFont = options.iconFont;
    this.icons = options.icons;
    this.mediaURL = options.mediaUrl ?? aiUIPublicMediaURL;
    this.loader = new AIUIRuntimeLoader(
      host,
      () => import('./runtime'),
      (error) =>
        this.report({
          code: 'EXECUTION_ERROR',
          message: `The A2UI renderer couldn't load: ${String(error)}`,
        }),
    );
  }

  /**
   * Tells the app what went wrong, after the current render: a reply's messages are applied
   * as it first shows, and an app may set state when told.
   */
  report(error: A2UIError, messageId?: string) {
    queueMicrotask(() => reportA2UIError(this.options, error, messageId));
  }

  remove(messageId: string) {
    this.replies.get(messageId)?.dispose();
    this.replies.delete(messageId);
  }

  view(document: AIUIDocument, messageId: string) {
    if (a2uiSourceOf(document) === undefined || this.loader.showsText(document))
      return null;
    // A finished reply whose A2UI made no surface shows its text instead, once that is known.
    if (this.loader.runtime?.showsNothing(this, document, messageId)) return null;
    return (
      <AIUIRuntimeView
        loader={this.loader}
        placeholder={<A2UIPlaceholder />}
        render={({ A2UIReplyContent }) => (
          <A2UIReplyContent document={document} engine={this} messageId={messageId} />
        )}
      />
    );
  }
}

/**
 * The renderer of [A2UI](https://a2ui.org) 1.0 for `AIUIHost`, on the official A2UI packages
 * (`@a2ui/web_core` and `@a2ui/react`, which the app installs). The app's components join its
 * catalog, so the agent places them like the basic catalog's own. The counterpart of
 * `A2UIRenderer` in StreamChatA2UI.
 */
export const createA2UIRenderer = (options: A2UIRendererOptions = {}): AIUIRenderer => {
  const catalogId = options.catalogId ?? A2UI_DEFAULT_CATALOG_ID;
  return {
    // As StreamChatA2UI's: the fence, the catalog and the instructions for both, with the
    // app's own instructions first and its tools, written with the A2UI core, which loads to
    // write them. Without them, when it can't load, the rest still goes to the agent's backend.
    capabilities: async (components, tools = []) => {
      const fence = `ui:a2ui@${A2UI_VERSION}`;
      const remove = Object.entries(options.basicComponents ?? {})
        .filter(([, view]) => view === null)
        .map(([name]) => name);
      let instructions: string | undefined;
      try {
        instructions = await a2uiInstructions({
          catalogId,
          components,
          fence,
          ...(options.instructions?.trim()
            ? { preamble: options.instructions.trim() }
            : {}),
          ...(remove.length ? { remove } : {}),
          ...(tools.length ? { tools } : {}),
        });
      } catch (error) {
        reportA2UIError(options, {
          code: 'EXECUTION_ERROR',
          message: `The A2UI instructions couldn't be written: ${String(error)}`,
        });
      }
      return {
        catalog_id: catalogId,
        fence,
        ...(instructions === undefined ? {} : { instructions }),
      };
    },
    createEngine: (host) => new A2UIEngine(host, options),
    format: 'a2ui',
    supports: supportsA2UIVersion,
  };
};
