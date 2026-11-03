import React, { useEffect, useState } from 'react';

import type { AIUIComponent } from '../AIComponents/GenerativeUI/AIUIComponent';
import {
  type AIUIDocument,
  aiUIDocumentText,
} from '../AIComponents/GenerativeUI/AIUIDocument';
import type { AIUIHost } from '../AIComponents/GenerativeUI/AIUIHost';
import type { AIUIEngine, AIUIRenderer } from '../AIComponents/GenerativeUI/AIUIRenderer';
import { OpenUIPlaceholder } from './OpenUIPlaceholder';
// Types only: the runtime, with the OpenUI packages, loads when a reply first shows OpenUI.
import type { OpenUILibrary, OpenUIRuntime } from './runtime';

// `@openuidev/react-lang` mounts OpenUI's inspector in development unless this is set first.
const DEVTOOLS_MOUNTED = Symbol.for('openui.devtools.autoMount');

// Loads the runtime, keeping OpenUI's inspector off the page unless the app asked for it.
const loadRuntime = (devtools = false) => {
  if (!devtools) (globalThis as Record<symbol, unknown>)[DEVTOOLS_MOUNTED] = true;
  return import('./runtime');
};

/** The fence an agent writes an OpenUI program in, which the agents router reads. */
export const OPENUI_FENCE = 'openui-lang';

/** What went wrong in a reply's OpenUI program, as OpenUI reports it to an agent. */
export type OpenUIError = {
  /** A code such as `unknown-component` or `missing-required`. */
  code: string;
  message: string;
  /** The component it is about, when it is about one. */
  component?: string;
  /** The statement it is about, such as `root`. */
  statementId?: string;
};

export type OpenUIRendererOptions = {
  /**
   * Whether OpenUI's own inspector shows in development, as `@openuidev/react-lang` mounts it
   * on every page that loads it, with its offers. Off by default: the app's page is the app's.
   */
  devtools?: boolean;
  /**
   * The library the agent writes with, before the app's components join it: OpenUI's chat
   * library (`openuiChatLibrary` of `@openuidev/react-ui/genui-lib`) by default. Give one made
   * with `createLibrary` of `@openuidev/react-lang` to use components of your own.
   */
  library?: OpenUILibrary;
  /**
   * Tells the app what went wrong in a reply's program, such as a component the library
   * doesn't have. The rest of the reply's UI still shows. Logged by default.
   */
  onError?: (error: OpenUIError, messageId: string) => void;
  /**
   * Runs the tools a program's `Query()` and `Mutation()` call. By default they are the host's
   * client tools, run in the page.
   */
  toolProvider?: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;
};

/**
 * Shows the OpenUI of one conversation. Each reply's form values are kept in the host, so
 * they survive scrolling.
 */
export class OpenUIEngine implements AIUIEngine {
  readonly host: AIUIHost;
  readonly options: OpenUIRendererOptions;
  /** The runtime, once loaded. */
  runtime?: OpenUIRuntime;

  private loading?: Promise<OpenUIRuntime>;

  constructor(host: AIUIHost, options: OpenUIRendererOptions) {
    this.host = host;
    this.options = options;
  }

  /** Loads the runtime, once. */
  load() {
    this.loading ??= loadRuntime(this.options.devtools).then((runtime) => {
      this.runtime = runtime;
      return runtime;
    });
    return this.loading;
  }

  report(error: OpenUIError, messageId: string) {
    if (this.options.onError) this.options.onError(error, messageId);
    else
      console.error(`A reply's OpenUI can't show: ${error.code} ${error.message}`, error);
  }

  view(document: AIUIDocument, messageId: string) {
    const program = aiUIDocumentText(document);
    // A finished reply with no program shows its text instead.
    if (program === undefined || (!document.isStreaming && program.trim() === '')) {
      return null;
    }
    return <OpenUIReplyView document={document} engine={this} messageId={messageId} />;
  }
}

type OpenUIReplyViewProps = {
  document: AIUIDocument;
  engine: OpenUIEngine;
  messageId: string;
};

// A reply's UI, once the runtime has loaded, which it does in the browser only, so the OpenUI
// packages stay out of an app whose agent never writes OpenUI.
const OpenUIReplyView = ({ document, engine, messageId }: OpenUIReplyViewProps) => {
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
            code: 'runtime-error',
            message: `The OpenUI renderer couldn't load: ${String(error)}`,
          },
          messageId,
        ),
    );
    return () => {
      live = false;
    };
  }, [engine, messageId, runtime]);
  if (!runtime) return <OpenUIPlaceholder />;
  const { OpenUIReplyContent } = runtime;
  return <OpenUIReplyContent document={document} engine={engine} messageId={messageId} />;
};

/**
 * The instructions that teach an agent's model to write OpenUI with the library and the app's
 * `components`, from OpenUI's own prompt generator. Give them to the agent's backend, as the
 * part of its instructions about UI. It loads the OpenUI packages.
 */
export const openUIInstructions = async (
  components: AIUIComponent[],
  options: Pick<OpenUIRendererOptions, 'devtools' | 'library'> = {},
) => (await loadRuntime(options.devtools)).instructionsFor(components, options.library);

/**
 * The renderer of [OpenUI](https://openui.com) for `AIUIHost`, on the official OpenUI packages
 * (`@openuidev/react-lang` and `@openuidev/react-ui`, which the app installs). The app's
 * components join its library, so the agent places them like the library's own. The
 * counterpart of `OpenUIRenderer` in StreamChatOpenUI.
 */
export const createOpenUIRenderer = (
  options: OpenUIRendererOptions = {},
): AIUIRenderer => ({
  capabilities: () => ({ fence: OPENUI_FENCE }),
  createEngine: (host) => new OpenUIEngine(host, options),
  format: 'openui',
});
