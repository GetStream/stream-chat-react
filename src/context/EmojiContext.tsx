import React, { PropsWithChildren, useContext } from 'react';
//@ts-expect-error
import DefaultEmojiIndex from 'emoji-mart/dist/utils/emoji-index/nimble-emoji-index.js';

import type {
  Data as EmojiMartData,
  EmojiSheetSize,
  NimbleEmojiIndex,
  NimbleEmojiProps,
  NimblePickerProps,
} from 'emoji-mart';

import type { UnknownType } from '../types/types';

export type CommonEmoji = {
  custom: boolean;
  emoticons: string[] | [];
  short_names: string[] | [];
};

export type EmojiSetDef = {
  imageUrl: string;
  sheetColumns: number;
  sheetRows: number;
  sheetSize: EmojiSheetSize;
  spriteUrl: string;
};

export type MinimalEmoji = CommonEmoji &
  EmojiSetDef & {
    colons: string;
    id: string;
    name: string;
    sheet_x: number;
    sheet_y: number;
  };

export type EmojiConfig = {
  commonEmoji: CommonEmoji;
  defaultMinimalEmojis: MinimalEmoji[];
  emojiData: EmojiMartData;
  emojiSetDef: EmojiSetDef;
};

export type EmojiContextValue = {
  emojiConfig: EmojiConfig;
  Emoji?: React.ComponentType<NimbleEmojiProps>;
  EmojiIndex?: NimbleEmojiIndex;
  EmojiPicker?: React.ComponentType<NimblePickerProps>;
};

const DefaultEmoji = React.lazy(async () => {
  //@ts-expect-error
  const emoji = await import('emoji-mart/dist/components/emoji/nimble-emoji.js');
  return { default: emoji.default };
});

const DefaultEmojiPicker = React.lazy(async () => {
  // @ts-expect-error
  const emojiPicker = await import('emoji-mart/dist/components/picker/nimble-picker.js');
  return { default: emojiPicker.default };
});

export const EmojiContext = React.createContext<EmojiContextValue | undefined>(undefined);

export const EmojiProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: EmojiContextValue;
}>) => {
  const {
    Emoji = DefaultEmoji,
    emojiConfig,
    EmojiIndex = DefaultEmojiIndex,
    EmojiPicker = DefaultEmojiPicker,
  } = value;

  const emojiContextValue: Required<EmojiContextValue> = {
    Emoji,
    emojiConfig,
    EmojiIndex,
    EmojiPicker,
  };

  return <EmojiContext.Provider value={emojiContextValue}>{children}</EmojiContext.Provider>;
};

export const useEmojiContext = (componentName?: string) => {
  const contextValue = useContext(EmojiContext);

  if (!contextValue) {
    console.warn(
      `The useEmojiContext hook was called outside of the EmojiContext provider. Make sure this hook is called within a child of the Channel component. The errored call is located in the ${componentName} component.`,
    );

    return {} as Required<EmojiContextValue>;
  }

  return contextValue as Required<EmojiContextValue>;
};

/**
 * Typescript currently does not support partial inference, so if EmojiContext
 * typing is desired while using the HOC withEmojiContext, the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withEmojiContext = <P extends UnknownType>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof EmojiContextValue>> => {
  const WithEmojiContextComponent = (props: Omit<P, keyof EmojiContextValue>) => {
    const componentContext = useEmojiContext();

    return <Component {...(props as P)} {...componentContext} />;
  };

  WithEmojiContextComponent.displayName = (
    Component.displayName ||
    Component.name ||
    'Component'
  ).replace('Base', '');

  return WithEmojiContextComponent;
};
