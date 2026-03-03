const CARET_MIRROR_CLASS = 'str-chat__textarea-caret-mirror';
const CARET_MARKER_CLASS = 'str-chat__textarea-caret-marker';

export type TextareaCaretRect = DOMRect | null;

/**
 * Returns the caret rectangle for a textarea using a mirror-measure hack.
 * It clones computed styles and content into a hidden element to infer the
 * caret position because textarea doesn't expose caret geometry.
 */

export const getTextareaCaretRect = (
  textarea: HTMLTextAreaElement | null,
  selectionEnd?: number,
): TextareaCaretRect => {
  if (!textarea || typeof window === 'undefined') return null;

  const caretIndex = Math.max(0, selectionEnd ?? textarea.selectionEnd ?? 0);
  const value = textarea.value ?? '';
  const valueBeforeCaret = value.slice(0, caretIndex);
  const valueAfterCaret = value.slice(caretIndex);

  const computedStyle = window.getComputedStyle(textarea);
  const mirror = document.createElement('div');
  mirror.className = CARET_MIRROR_CLASS;
  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.top = '0';
  mirror.style.left = '-9999px';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordWrap = 'break-word';

  for (const property of computedStyle) {
    mirror.style.setProperty(property, computedStyle.getPropertyValue(property));
  }

  mirror.textContent = valueBeforeCaret;

  const caretMarker = document.createElement('span');
  caretMarker.className = CARET_MARKER_CLASS;
  caretMarker.textContent = valueAfterCaret.length ? valueAfterCaret : '.';
  mirror.appendChild(caretMarker);

  document.body.appendChild(mirror);
  mirror.scrollTop = textarea.scrollTop;
  mirror.scrollLeft = textarea.scrollLeft;

  const textareaRect = textarea.getBoundingClientRect();
  const mirrorRect = mirror.getBoundingClientRect();
  const caretRect = caretMarker.getBoundingClientRect();

  document.body.removeChild(mirror);

  const left = textareaRect.left + (caretRect.left - mirrorRect.left);
  const top = textareaRect.top + (caretRect.top - mirrorRect.top);
  const height = caretRect.height || parseFloat(computedStyle.lineHeight) || 0;

  return new DOMRect(left, top, 0, height);
};
