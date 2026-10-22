const CARET_MIRROR_CLASS = 'str-chat__textarea-caret-mirror';
const CARET_MARKER_CLASS = 'str-chat__textarea-caret-marker';

export type TextareaCaretRect = DOMRect | null;

/**
 * Measures the caret of a textarea by mirroring its styles and text into a hidden element, because
 * a textarea exposes no caret geometry.
 *
 * @param textarea - Textarea to measure.
 * @param selectionEnd - Caret index. Defaults to `textarea.selectionEnd`.
 * @returns A zero-width rect at the caret in viewport coordinates, or `null` when there is no
 * textarea or no `window`.
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
