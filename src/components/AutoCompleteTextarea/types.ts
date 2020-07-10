import React from 'react';

export interface TriggerMap {
  [triggerChar: string]: {
    output?: (
      item: { [key: string]: any },
      trigger?: string,
    ) =>
      | {
          key?: string;
          text: string;
          caretPosition: 'start' | 'end' | 'next' | number;
        }
      | string
      | null;
    dataProvider: (
      q: string,
      text: string,
      onReady: (data: any[], token: string) => void,
    ) => Promise<void> | Array<Object | string>;
    component: React.ComponentType<any>;
    callback?: (item: Object) => void;
  };
}
