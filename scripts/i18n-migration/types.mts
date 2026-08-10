// Shapes shared by the i18n migration scripts. These were implicit while the scripts were
// plain JS; declaring them once is most of the value of the TypeScript conversion.

/** One row of the reviewed old-key -> new-key mapping (`ai-docs/i18n-v15-key-map.json`). */
export type KeyMapEntry = {
  /** The namespaced replacement, e.g. `messageComposer.sendButton.send.ariaLabel`. */
  key: string;
  /**
   * `false` when the value is a formatter expression or postProcessor directive rather than
   * English copy — those keys resolve from en.json and take no inline default.
   */
  prose: boolean;
  /** The catalog holds `_one` / `_other` forms; call sites pass `count`. */
  plural?: boolean;
  /** Used from more than one namespace, so it lives under `common.*`. */
  shared?: boolean;
};

export type KeyMap = {
  $comment?: string;
  count: number;
  keys: Record<string, KeyMapEntry>;
};

/** How a translation key reached `t()` — determines whether a codemod can rewrite it. */
export type CallSiteForm =
  /** `t('key')` */
  | 'literal'
  /** `t(cond ? 'a' : 'b')` */
  | 'conditional'
  /** `t(value || 'a')` */
  | 'fallback'
  /** `fallbackTranslationKey: 'a'` in a notification-translator options object */
  | 'optionProp';

export type CallSite = {
  file: string;
  line: number;
  key: string;
  form: CallSiteForm;
  /** Whether the call sits in a JSX attribute, an object property, or JSX children. */
  ctxKind: 'jsxAttr' | 'prop' | 'jsxChild' | 'none';
  /** The attribute/property name, which is the best signal for the modality suffix. */
  ctxName: string | null;
  interpolations: string[];
  start: number;
  end: number;
};

export type CallSiteReport = {
  generatedFrom: string;
  count: number;
  records: CallSite[];
};

/** A pending source edit, applied right-to-left so earlier offsets stay valid. */
export type Edit = {
  start: number;
  end: number;
  text: string;
};

/** English copy keyed by the *old* natural-language keys (the pre-migration en.json). */
export type EnglishCatalog = Record<string, string>;
