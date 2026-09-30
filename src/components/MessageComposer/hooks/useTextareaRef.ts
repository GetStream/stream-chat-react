import { useEffect, useRef } from 'react';
import type { MessageComposerProps } from '../MessageComposer';

export const useTextareaRef = (props: MessageComposerProps) => {
  const { focus } = props;
  const textareaRef = useRef<HTMLTextAreaElement>(undefined);
  // Focus on mount without scrolling the host page to the composer
  useEffect(() => {
    if (focus && textareaRef.current) {
      textareaRef.current.focus({ preventScroll: true });
    }
  }, [focus]);

  return {
    textareaRef,
  };
};
