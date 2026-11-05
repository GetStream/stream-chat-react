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

/**
 * A name as words, such as "Submit form" for `submit_form` or `submitForm`: what the person's
 * message says when what they used has no words of its own.
 */
export const aiUIWords = (name: string) => {
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * `value` without the person's secrets, such as a password they typed: each string that holds
 * one has it taken out, wherever it is, so none reaches the agent or what is kept.
 */
export const withoutSecretValues = <T>(value: T, secrets: readonly string[]): T => {
  const shown = secrets.filter((secret) => secret !== '');
  if (!shown.length) return value;
  const clean = (item: unknown): unknown => {
    if (typeof item === 'string') {
      return shown.reduce((text, secret) => text.split(secret).join(''), item);
    }
    if (Array.isArray(item)) return item.map(clean);
    if (isRecord(item)) {
      return Object.fromEntries(
        Object.entries(item).map(([key, entry]) => [key, clean(entry)]),
      );
    }
    return item;
  };
  return clean(value) as T;
};

/** `text` as a sentence, ending in a full stop unless it ends otherwise. */
export const aiUISentence = (text: string) => {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

type ClickEvent = {
  /** Which button was pressed: 0 the main one, 1 the middle one, 2 the one for a menu. */
  button?: number;
  preventDefault: () => void;
  stopPropagation: () => void;
  target: EventTarget | null;
  type?: string;
};

/**
 * A click handler that opens the links of a reply's UI the way `host` allows, rather than
 * wherever they point, since the agent writes them. Give it to the element around them as its
 * capturing click and auxclick handler: of the other buttons, only the middle one opens a link,
 * and the one for a menu shows the menu.
 */
export const aiUILinkOpener = (host: AIUIHost | undefined) => (event: ClickEvent) => {
  if (event.type === 'auxclick' && event.button !== 1) return;
  const link = (event.target as Element | null)?.closest?.('a[href]');
  if (!link) return;
  event.preventDefault();
  event.stopPropagation();
  host?.open(link.getAttribute('href') ?? '');
};
