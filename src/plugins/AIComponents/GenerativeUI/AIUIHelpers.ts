// What the generated UI layer and its renderers share. Free of React and of any renderer's
// packages, so what writes an agent's instructions on a server reads it too.
import type { AIUIHost } from './AIUIHost';

/** Whether `value` is a JSON object, rather than an array, `null` or a scalar. */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * The type an app's component is placed by in a format's UI, such as `PlaceCard` for
 * `place_card`: named as A2UI's and OpenUI's own components are.
 */
export const aiUITypeName = (name: string) =>
  name
    .split(/[_\- ]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

/** `text` as a sentence, ending in a full stop unless it ends otherwise. */
export const aiUISentence = (text: string) => {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

type ClickEvent = {
  preventDefault: () => void;
  stopPropagation: () => void;
  target: EventTarget | null;
};

/**
 * A click handler that opens the links of a reply's UI the way `host` allows, rather than
 * wherever they point, since the agent writes them. Give it to the element around them as its
 * capturing click and auxclick handler.
 */
export const aiUILinkOpener = (host: AIUIHost | undefined) => (event: ClickEvent) => {
  const link = (event.target as Element | null)?.closest?.('a[href]');
  if (!link) return;
  event.preventDefault();
  event.stopPropagation();
  host?.open(link.getAttribute('href') ?? '');
};
