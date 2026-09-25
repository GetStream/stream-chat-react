import { useEffect, useRef } from 'react';
import { Picker as EmojiMartPicker } from 'emoji-mart';

/**
 * Untyped [properties](https://github.com/missive/emoji-mart/tree/v5.5.2#options--props) forwarded
 * to the emoji-mart `Picker` custom element.
 */
export type PickerProps = Record<string, unknown>;

// React wrapper around the emoji-mart `Picker` custom element. Taken and adjusted from
// @emoji-mart/react (MIT, Copyright (c) Missive):
// https://github.com/missive/emoji-mart/blob/16978d04a766eec6455e2e8bb21cd8dc0b3c7436/packages/emoji-mart-react/react.tsx
//
// Vendored rather than depended upon because @emoji-mart/react does not declare React 19 in its
// peer dependencies, which forces consumers into `package.json` overrides.
export const Picker = (props: PickerProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const instance = useRef<EmojiMartPicker | null>(null);
  if (instance.current) {
    instance.current.update(props);
  }

  useEffect(() => {
    instance.current = new EmojiMartPicker({ ...props, ref });
    return () => {
      instance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} />;
};
