import type React from 'react';

export interface TriggerMap {
  [triggerChar: string]: {
    component: React.ComponentType<unknown>;
    dataProvider: (
      q: string,
      text: string,
      onReady: (data: unknown[], token: string) => void,
    ) => Promise<void> | Array<Record<string, unknown> | string>;
    callback?: (item: Record<string, unknown>) => void;
    output?: (
      item: { [key: string]: unknown },
      trigger?: string,
    ) =>
      | {
          caretPosition: 'start' | 'end' | 'next' | number;
          text: string;
          key?: string;
        }
      | string
      | null;
  };
}
