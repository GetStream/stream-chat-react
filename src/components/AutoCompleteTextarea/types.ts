import React from 'react';

export interface TriggerMap {
  [triggerChar: string]: {
    component: React.ComponentType<any>;
    dataProvider: (
      q: string,
      text: string,
      onReady: (data: any[], token: string) => void,
    ) => Promise<void> | Array<Object | string>;
    callback?: (item: Object) => void;
    output?: (
      item: { [key: string]: any },
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
