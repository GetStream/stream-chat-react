import { useEffect, useRef } from 'react';
import type { MessageComposerProps } from '../MessageComposer';

export const useTextareaRef = (props: MessageComposerProps) => {
  const { focus } = props;
  const textareaRef = useRef<HTMLTextAreaElement>(undefined);
  // Focus
  useEffect(() => {
    if (focus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [focus]);

  return {
    textareaRef,
  };
};
