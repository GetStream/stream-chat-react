import React from 'react';

import type { AIUIComponent } from '../AIComponents/GenerativeUI/AIUIComponent';
import {
  type AIUIDocument,
  aiUIDocumentText,
} from '../AIComponents/GenerativeUI/AIUIDocument';
import type { AIUIHost } from '../AIComponents/GenerativeUI/AIUIHost';
import type { AIUIEngine, AIUIRenderer } from '../AIComponents/GenerativeUI/AIUIRenderer';
import {
  AIUIRuntimeLoader,
  AIUIRuntimeView,
} from '../AIComponents/GenerativeUI/AIUIRuntimeLoader';
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
   * doesn't have, with the reply's id. The rest of the reply's UI still shows. What is wrong
   * with the renderer rather than a reply, such as an app's component that can't join the
   * library or a runtime that couldn't load, comes without an id. Logged by default.
   */
  onError?: (error: OpenUIError, messageId?: string) => void;
  /**
   * Runs the tools a program's `Query()` and `Mutation()` call. By default they are the host's
   * client tools, run in the page.
   */
  toolProvider?: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;
};

const reportOpenUIError = (
  options: OpenUIRendererOptions,
  error: OpenUIError,
  messageId?: string,
) => {
  if (options.onError) options.onError(error, messageId);
  else
    console.error(`A reply's OpenUI can't show: ${error.code} ${error.message}`, error);
};

/**
 * Shows the OpenUI of one conversation. Each reply's form values are kept in the host, so
 * they survive scrolling.
 */
export class OpenUIEngine implements AIUIEngine {
  readonly host: AIUIHost;
  /** Loads the runtime, the OpenUI packages, when a reply first shows OpenUI. */
  readonly loader: AIUIRuntimeLoader<OpenUIRuntime>;
  readonly options: OpenUIRendererOptions;
  /** What has been said about each reply's program, so each error is said once. */
  readonly reported = new Map<string, Set<string>>();

  // The program of each finished reply that draws nothing, so the reply shows its text.
  private readonly drawsNothing = new Map<string, string>();

  constructor(host: AIUIHost, options: OpenUIRendererOptions) {
    this.host = host;
    this.options = options;
    this.loader = new AIUIRuntimeLoader(
      host,
      () => loadRuntime(options.devtools),
      (error) =>
        this.report({
          code: 'runtime-error',
          message: `The OpenUI renderer couldn't load: ${String(error)}`,
        }),
    );
  }

  /** Notes that a finished reply's program draws nothing, such as words that aren't OpenUI. */
  drewNothing(messageId: string, program: string) {
    if (this.drawsNothing.get(messageId) === program) return;
    this.drawsNothing.set(messageId, program);
    this.host.refresh();
  }

  remove(messageId: string) {
    this.drawsNothing.delete(messageId);
    this.reported.delete(messageId);
  }

  report(error: OpenUIError, messageId?: string) {
    reportOpenUIError(this.options, error, messageId);
  }

  view(document: AIUIDocument, messageId: string) {
    const program = aiUIDocumentText(document);
    // A finished reply whose program draws nothing shows its text instead.
    if (
      program === undefined ||
      this.loader.showsText(document) ||
      (!document.isStreaming &&
        (program.trim() === '' || this.drawsNothing.get(messageId) === program))
    ) {
      return null;
    }
    return (
      <AIUIRuntimeView
        loader={this.loader}
        placeholder={<OpenUIPlaceholder />}
        render={({ OpenUIReplyContent }) => (
          <OpenUIReplyContent document={document} engine={this} messageId={messageId} />
        )}
      />
    );
  }
}

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
  // As StreamChatOpenUI's: the fence and the instructions, written with OpenUI's own prompt
  // generator, which loads the OpenUI packages to write them. Without them, when they can't
  // load, the fence still goes to the agent's backend.
  capabilities: async (components) => {
    let instructions: string | undefined;
    try {
      instructions = await openUIInstructions(components, options);
    } catch (error) {
      reportOpenUIError(options, {
        code: 'runtime-error',
        message: `The OpenUI instructions couldn't be written: ${String(error)}`,
      });
    }
    return {
      fence: OPENUI_FENCE,
      ...(instructions === undefined ? {} : { instructions }),
    };
  },
  createEngine: (host) => new OpenUIEngine(host, options),
  format: 'openui',
});
