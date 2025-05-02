import { useEffect, useRef } from 'react';
import type { MessageInputProps } from '../MessageInput';

export const useTextareaRef = (props: MessageInputProps) => {
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
