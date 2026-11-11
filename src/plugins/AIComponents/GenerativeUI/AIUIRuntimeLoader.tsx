import React, { type ReactNode, useEffect, useState } from 'react';

import type { AIUIDocument } from './AIUIDocument';
import type { AIUIHost } from './AIUIHost';
import { AIThemeScope } from '../themeScope';

/**
 * Loads the runtime of a renderer, its format's packages, once and in the browser only, when a
 * reply first shows the format: the packages may not run on a server, and are of no use to an
 * app whose agent never writes it. When the runtime can't load, such as when a deploy replaced
 * the file it is in, the replies already written show their text, the next reply the agent
 * writes in the format tries again, and the failure is reported once.
 */
export class AIUIRuntimeLoader<Runtime> {
  /** The runtime, once loaded. */
  runtime?: Runtime;

  private failed = false;
  private readonly host: AIUIHost;
  private readonly importRuntime: () => Promise<Runtime>;
  private loading?: Promise<Runtime>;
  private readonly onFailure: (error: unknown) => void;

  constructor(
    host: AIUIHost,
    importRuntime: () => Promise<Runtime>,
    onFailure: (error: unknown) => void,
  ) {
    this.host = host;
    this.importRuntime = importRuntime;
    this.onFailure = onFailure;
  }

  /** Loads the runtime, once while it loads; again after it failed to. */
  load() {
    this.loading ??= this.importRuntime().then(
      (runtime) => {
        this.runtime = runtime;
        // What a reply shows can depend on the runtime, such as whether it shows its text.
        this.host.refresh();
        return runtime;
      },
      (error: unknown) => {
        this.loading = undefined;
        if (!this.failed) {
          this.failed = true;
          this.onFailure(error);
          this.host.refresh();
        }
        throw error;
      },
    );
    return this.loading;
  }

  /**
   * Whether a reply shows its text because the runtime couldn't load: one already written does,
   * and one the agent is writing shows its placeholder while the runtime loads again.
   */
  showsText(document: AIUIDocument) {
    return this.failed && !this.runtime && !document.isStreaming;
  }
}

export type AIUIRuntimeViewProps<Runtime> = {
  loader: AIUIRuntimeLoader<Runtime>;
  /** What shows while the runtime loads. */
  placeholder: ReactNode;
  /** The reply's UI, once the runtime has loaded. */
  render: (runtime: Runtime) => ReactNode;
};

/** A reply's UI from a renderer's runtime, which it loads the first time one shows. */
export const AIUIRuntimeView = <Runtime,>({
  loader,
  placeholder,
  render,
}: AIUIRuntimeViewProps<Runtime>) => {
  const [runtime, setRuntime] = useState(loader.runtime);
  useEffect(() => {
    if (runtime) return;
    let live = true;
    loader.load().then(
      (loaded) => {
        if (live) setRuntime(loaded);
      },
      // The loader has said why, once, and the host shows the reply's text.
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [loader, runtime]);
  // What the renderer draws has no root element of the SDK's, so the scope is a layout-neutral
  // wrapper, added only when nothing above provides one.
  return <AIThemeScope>{runtime ? render(runtime) : placeholder}</AIThemeScope>;
};
