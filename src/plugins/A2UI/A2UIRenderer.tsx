import React, {
  type ComponentPropsWithoutRef,
  type ComponentType,
  useEffect,
  useState,
} from 'react';

import type { AIUIDocument } from '../AIComponents/GenerativeUI/AIUIDocument';
import type { AIUIHost } from '../AIComponents/GenerativeUI/AIUIHost';
import type { AIUIEngine, AIUIRenderer } from '../AIComponents/GenerativeUI/AIUIRenderer';
import { A2UIPlaceholder } from './A2UIPlaceholder';
import { A2UI_DEFAULT_CATALOG_ID } from './catalogDocument';
import { A2UI_VERSION, a2uiSourceOf, supportsA2UIVersion } from './A2UIStream';
// Types only: the runtime, with the A2UI packages, loads in the browser when a reply first
// shows A2UI.
import type { A2UIReplyState, A2UIRuntime } from './runtime';

export { A2UI_DEFAULT_CATALOG_ID };

/** What went wrong in a reply's A2UI, as the A2UI specification reports it to an agent. */
export type A2UIError = {
  /** A code such as `VALIDATION_FAILED` or `EXPRESSION_ERROR`. */
  code: string;
  message: string;
  /** Where in the message it went wrong, as a JSON pointer. */
  path?: string;
  surfaceId?: string;
};

export type A2UIRendererOptions = {
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
   * Tells the app what went wrong in a reply's A2UI, such as a message that isn't JSON or a
   * component the catalog doesn't have. The rest of the reply's UI still shows. Logged by
   * default.
   */
  onError?: (error: A2UIError, messageId: string) => void;
};

/**
 * Shows the A2UI of one conversation. Each reply's surfaces are its own, kept for as long as
 * the host keeps the engine, so what the person entered survives scrolling.
 */
export class A2UIEngine implements AIUIEngine {
  readonly catalogId: string;
  readonly host: AIUIHost;
  readonly iconFont?: string;
  readonly icons?: A2UIRendererOptions['icons'];
  /** Each reply's surfaces, by the reply's id. */
  readonly replies = new Map<string, A2UIReplyState>();
  /** The runtime, once loaded. */
  runtime?: A2UIRuntime;

  private loading?: Promise<A2UIRuntime>;
  private readonly options: A2UIRendererOptions;

  constructor(host: AIUIHost, options: A2UIRendererOptions) {
    this.host = host;
    this.options = options;
    this.catalogId = options.catalogId ?? A2UI_DEFAULT_CATALOG_ID;
    this.iconFont = options.iconFont;
    this.icons = options.icons;
  }

  /** Loads the runtime, once. */
  load() {
    this.loading ??= import('./runtime').then((runtime) => {
      this.runtime = runtime;
      return runtime;
    });
    return this.loading;
  }

  report(error: A2UIError, messageId: string) {
    if (this.options.onError) this.options.onError(error, messageId);
    else
      console.error(`A reply's A2UI can't show: ${error.code} ${error.message}`, error);
  }

  remove(messageId: string) {
    this.replies.get(messageId)?.dispose();
    this.replies.delete(messageId);
  }

  view(document: AIUIDocument, messageId: string) {
    if (a2uiSourceOf(document) === undefined) return null;
    // A finished reply whose A2UI made no surface shows its text instead, once that is known.
    if (this.runtime?.showsNothing(this, document, messageId)) return null;
    return <A2UIReplyView document={document} engine={this} messageId={messageId} />;
  }
}

type A2UIReplyViewProps = {
  document: AIUIDocument;
  engine: A2UIEngine;
  messageId: string;
};

// A reply's surfaces, once the runtime has loaded. Only in the browser: the A2UI packages
// define custom elements, which a server has no way to.
const A2UIReplyView = ({ document, engine, messageId }: A2UIReplyViewProps) => {
  const [runtime, setRuntime] = useState(engine.runtime);
  useEffect(() => {
    if (runtime) return;
    let live = true;
    engine.load().then(
      (loaded) => {
        if (live) setRuntime(loaded);
      },
      (error: unknown) =>
        engine.report(
          {
            code: 'EXECUTION_ERROR',
            message: `The A2UI renderer couldn't load: ${String(error)}`,
          },
          messageId,
        ),
    );
    return () => {
      live = false;
    };
  }, [engine, messageId, runtime]);
  if (!runtime) return <A2UIPlaceholder />;
  const { A2UIReplyContent } = runtime;
  return <A2UIReplyContent document={document} engine={engine} messageId={messageId} />;
};

/**
 * The renderer of [A2UI](https://a2ui.org) 1.0 for `AIUIHost`, on the official A2UI packages
 * (`@a2ui/web_core` and `@a2ui/react`, which the app installs). The app's components join its
 * catalog, so the agent places them like the basic catalog's own. The counterpart of
 * `A2UIRenderer` in StreamChatA2UI.
 */
export const createA2UIRenderer = (options: A2UIRendererOptions = {}): AIUIRenderer => {
  const catalogId = options.catalogId ?? A2UI_DEFAULT_CATALOG_ID;
  return {
    capabilities: () => ({
      catalog_id: catalogId,
      fence: `ui:a2ui@${A2UI_VERSION}`,
    }),
    createEngine: (host) => new A2UIEngine(host, options),
    format: 'a2ui',
    supports: supportsA2UIVersion,
  };
};
