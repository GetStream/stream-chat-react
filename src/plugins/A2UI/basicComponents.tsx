// The basic catalog's components a person sees most, in Stream's look: the ones Stream has a
// component for are Stream's, rather than the A2UI elements themed. The rest of the catalog,
// its layouts and media, stays A2UI's own.
import React, {
  type ComponentPropsWithoutRef,
  createContext,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import type { ReactA2uiComponentProps } from '@a2ui/react';
import type { ComponentContext } from '@a2ui/web_core';

import { Button } from '../../components/Button';
import { Checkbox, FieldError, TextInput } from '../../components/Form';
import type { IconSlots } from '../../components/Icons/slots';
import { useStableId } from '../../components/UtilityComponents/useStableId';
import { useComponentContextIcons } from '../../context/useComponentContextIcons';
import { useTranslationContext } from '../../context/TranslationContext';
import { AIMarkdown } from '../AIComponents/AIMarkdown';
import { aiUILinkOpener, isRecord } from '../AIComponents/GenerativeUI/AIUIHelpers';
import { useAIUIEntrance } from '../AIComponents/GenerativeUI/AIUIEntrance';
import { aiUIMediaSource } from '../AIComponents/GenerativeUI/AIUIMedia';
import type { A2UIEngine } from './A2UIRenderer';

/** The engine of the surfaces below, for what in them reaches the host, such as links. */
export const A2UIEngineContext = createContext<A2UIEngine | undefined>(undefined);

// Whether a Text is the label of a Button, where it shows as words rather than as Markdown.
const A2UILabelContext = createContext(false);

type Weighted = { accessibility?: unknown; weight?: unknown };

// A part's flex weight in its Row or Column, as the A2UI elements apply theirs.
const weightOf = ({ weight }: Weighted): CSSProperties | undefined =>
  typeof weight === 'number' ? { flex: weight } : undefined;

type Accessibility = {
  'aria-description'?: string;
  'aria-hidden'?: boolean;
  'aria-label'?: string;
  'aria-live'?: 'assertive' | 'polite';
};

const said = (value: unknown) =>
  value === undefined || value === null || value === '' ? undefined : String(value);

// What the agent tells assistive technology about a part, with its `accessibility`, as the A2UI
// elements tell it: what to call it, what more to say about it, whether to announce its changes,
// and whether to leave it out.
const accessibilityOf = ({ accessibility }: Weighted): Accessibility => {
  if (!isRecord(accessibility)) return {};
  const { description, hidden, label, live } = accessibility;
  const named = said(label);
  const described = said(description);
  return {
    ...(named ? { 'aria-label': named } : {}),
    ...(described ? { 'aria-description': described } : {}),
    ...(live === 'polite' || live === 'assertive' ? { 'aria-live': live } : {}),
    ...(hidden === true ? { 'aria-hidden': true } : {}),
  };
};

// A part that comes in when it shows, carrying its weight and what the agent tells assistive
// technology about it: the props of its element, and the scope of what shows with it.
const usePart = (props: Weighted) => {
  const { props: entrance, scope } = useAIUIEntrance();
  return {
    part: {
      ...entrance,
      ...accessibilityOf(props),
      style: { ...entrance.style, ...weightOf(props) },
    },
    scope,
  };
};

const textOf = (value: unknown) =>
  typeof value === 'string' ? value : value == null ? '' : String(value);

const errorsOf = ({ isValid, validationErrors }: Checked) =>
  isValid === false && Array.isArray(validationErrors)
    ? validationErrors.filter((error): error is string => typeof error === 'string')
    : [];

type Checked = { isValid?: unknown; validationErrors?: unknown };

// What a part's checks found, under it.
const Problems = ({ errors, id }: { errors: string[]; id: string }) =>
  errors.length ? (
    <FieldError
      className='str-chat__a2ui-problems'
      id={id}
      role='alert'
      text={errors.join(' ')}
    />
  ) : null;

type ButtonProps = Checked &
  Weighted & {
    action?: unknown;
    child?: unknown;
    variant?: unknown;
  };

const isBorderlessButton = (context: ComponentContext, id: unknown) => {
  if (typeof id !== 'string') return false;
  const component = context.surfaceComponents.get(id);
  return component?.type === 'Button' && component.properties.variant === 'borderless';
};

/**
 * Where a borderless Button is among the follow-ups of a Column: `first`, or `after` another
 * borderless Button, which a hairline then parts it from. A borderless Button anywhere else, such
 * as in a Row, is not a follow-up, and reads as a link.
 */
const followUpPlaceOf = (
  context: ComponentContext | undefined,
): 'first' | 'after' | undefined => {
  if (!context) return undefined;
  const { id } = context.componentModel;
  for (const parent of context.surfaceComponents.values) {
    const { children } = parent.properties;
    if (parent.type !== 'Column' || !Array.isArray(children)) continue;
    const index = children.indexOf(id);
    if (index < 0) continue;
    return index > 0 && isBorderlessButton(context, children[index - 1])
      ? 'after'
      : 'first';
  }
  return undefined;
};

/**
 * A2UI's Button as Stream's: primary for the main call to action, and borderless as a ghost
 * button in the accent colour, which the spec means to read as a link, as it does on iOS.
 */
export const A2UIButton = ({
  buildChild,
  context,
  props,
}: ReactA2uiComponentProps<ButtonProps>) => {
  const { part, scope } = usePart(props);
  const isDisabled = props.isValid === false;
  const followUp = props.variant === 'borderless' ? followUpPlaceOf(context) : undefined;
  const look =
    props.variant === 'primary'
      ? ({ appearance: 'solid', variant: 'primary' } as const)
      : props.variant === 'borderless'
        ? ({ appearance: 'ghost', variant: 'primary' } as const)
        : ({ appearance: 'outline', variant: 'secondary' } as const);
  return (
    <Button
      {...look}
      {...part}
      className={clsx(
        'str-chat__a2ui-button',
        `str-chat__a2ui-button--${
          props.variant === 'primary' || props.variant === 'borderless'
            ? props.variant
            : 'default'
        }`,
        {
          'str-chat__a2ui-button--follow-up': followUp,
          'str-chat__a2ui-button--follow-up-after': followUp === 'after',
        },
        part.className,
      )}
      disabled={isDisabled}
      onClick={() => {
        if (!isDisabled && typeof props.action === 'function') props.action();
      }}
      size='md'
    >
      <A2UILabelContext.Provider value>
        {scope(typeof props.child === 'string' ? buildChild(props.child) : null)}
      </A2UILabelContext.Provider>
    </Button>
  );
};

type CardProps = Weighted & { child?: unknown };

/** A2UI's Card: a box of its own in the reply, as Stream's cards are. */
export const A2UICard = ({ buildChild, props }: ReactA2uiComponentProps<CardProps>) => {
  const { part, scope } = usePart(props);
  return (
    <div
      {...part}
      className={clsx('str-chat__a2ui-card', part.className)}
      role={part['aria-label'] ? 'group' : undefined}
    >
      {scope(typeof props.child === 'string' ? buildChild(props.child) : null)}
    </div>
  );
};

type TextProps = Weighted & { text?: unknown; variant?: unknown };

/**
 * A2UI's Text: Markdown rendered as replies' is, or a caption. Its links open the
 * way the host allows, since the agent writes them, rather than wherever they point. As a
 * Button's label it is the button's words.
 */
export const A2UIText = ({ props }: ReactA2uiComponentProps<TextProps>) =>
  useContext(A2UILabelContext) ? (
    <span className='str-chat__a2ui-text str-chat__a2ui-text--label'>
      {textOf(props.text)}
    </span>
  ) : (
    <A2UITextPart {...props} />
  );

// A Text that is a part of its own, coming in when it shows.
const A2UITextPart = (props: TextProps) => {
  const engine = useContext(A2UIEngineContext);
  const { part } = usePart(props);
  const text = textOf(props.text);
  const variant = typeof props.variant === 'string' ? props.variant : 'body';
  const classes = clsx(
    'str-chat__a2ui-text',
    `str-chat__a2ui-text--${variant}`,
    part.className,
  );
  // A generic element can't be named, so a Text the agent names is a group.
  const role = part['aria-label'] ? 'group' : undefined;
  if (variant === 'caption') {
    return (
      <p {...part} className={classes} role={role}>
        {text}
      </p>
    );
  }
  const follow = aiUILinkOpener(engine?.host);
  return (
    <div
      {...part}
      className={classes}
      onAuxClickCapture={follow}
      onClickCapture={follow}
      role={role}
    >
      <AIMarkdown>{text}</AIMarkdown>
    </div>
  );
};

type TextFieldProps = Checked &
  Weighted & {
    label?: unknown;
    placeholder?: unknown;
    setValue?: unknown;
    value?: unknown;
    variant?: unknown;
  };

/** A2UI's TextField as Stream's text input, or a text area for long text. */
export const A2UITextField = ({ props }: ReactA2uiComponentProps<TextFieldProps>) => {
  // What names and describes the field goes on its input; the rest on the part.
  const {
    part: { 'aria-description': description, 'aria-label': name, ...part },
  } = usePart(props);
  const named = { 'aria-description': description, 'aria-label': name };
  const id = useStableId();
  const problemsId = `${id}-problems`;
  const errors = errorsOf(props);
  const label = textOf(props.label);
  const placeholder = textOf(props.placeholder) || undefined;
  const value = textOf(props.value);
  const change = (next: string) => {
    if (typeof props.setValue === 'function') props.setValue(next);
  };
  const field =
    props.variant === 'longText' ? (
      <div
        className={clsx(
          'str-chat__form-text-input',
          errors.length > 0 && 'str-chat__form-text-input--error',
        )}
      >
        {label && (
          <label className='str-chat__form-text-input__label' htmlFor={id}>
            {label}
          </label>
        )}
        <div className='str-chat__form-text-input__wrapper str-chat__form-text-input__wrapper--outline'>
          <div className='str-chat__form-text-input__control-row'>
            <textarea
              {...named}
              aria-describedby={errors.length ? problemsId : undefined}
              aria-invalid={errors.length > 0}
              className='str-chat__form-text-input__input str-chat__a2ui-text-field__long'
              id={id}
              onChange={(event) => change(event.target.value)}
              placeholder={placeholder}
              rows={3}
              value={value}
            />
          </div>
        </div>
      </div>
    ) : (
      <TextInput
        {...named}
        aria-describedby={errors.length ? problemsId : undefined}
        error={errors.length > 0}
        id={id}
        label={label || undefined}
        onChange={(event) => change(event.target.value)}
        placeholder={placeholder}
        type={
          props.variant === 'number'
            ? 'number'
            : props.variant === 'obscured'
              ? 'password'
              : 'text'
        }
        value={value}
      />
    );
  return (
    <div {...part} className={clsx('str-chat__a2ui-text-field', part.className)}>
      {field}
      <Problems errors={errors} id={problemsId} />
    </div>
  );
};

type ChoicePickerProps = Checked &
  Weighted & {
    displayStyle?: unknown;
    filterable?: unknown;
    label?: unknown;
    options?: unknown;
    setValue?: unknown;
    value?: unknown;
    variant?: unknown;
  };

type Option = { label: string; value: string };

const optionsOf = (options: unknown): Option[] =>
  Array.isArray(options)
    ? options.flatMap((option: unknown) => {
        if (typeof option !== 'object' || option === null) return [];
        const { label, value } = option as Record<string, unknown>;
        return typeof value === 'string'
          ? [{ label: textOf(label) || value, value }]
          : [];
      })
    : [];

/**
 * A2UI's ChoicePicker: Stream's check marks, or chips as Stream's buttons, choosing one option
 * or several. A filterable one has a search field above its options.
 */
export const A2UIChoicePicker = ({
  props,
}: ReactA2uiComponentProps<ChoicePickerProps>) => {
  const { t } = useTranslationContext();
  const { part } = usePart(props);
  const id = useStableId();
  const [filter, setFilter] = useState('');
  const errors = errorsOf(props);
  const label = textOf(props.label);
  const isMultiple = props.variant === 'multipleSelection';
  const isChips = props.displayStyle === 'chips';
  const selected = Array.isArray(props.value)
    ? props.value.filter((value): value is string => typeof value === 'string')
    : typeof props.value === 'string'
      ? [props.value]
      : [];
  const toggle = (value: string) => {
    if (typeof props.setValue !== 'function') return;
    if (!isMultiple) props.setValue([value]);
    else if (selected.includes(value))
      props.setValue(selected.filter((chosen) => chosen !== value));
    else props.setValue([...selected, value]);
  };
  const needle = filter.trim().toLowerCase();
  const options = optionsOf(props.options).filter(
    (option) =>
      props.filterable !== true ||
      needle === '' ||
      option.label.toLowerCase().includes(needle),
  );
  return (
    <div
      {...part}
      aria-describedby={errors.length ? `${id}-problems` : undefined}
      aria-labelledby={label && !part['aria-label'] ? `${id}-label` : undefined}
      className={clsx('str-chat__a2ui-choice-picker', part.className)}
      role={isMultiple || isChips ? 'group' : 'radiogroup'}
    >
      {label && (
        <div className='str-chat__a2ui-choice-picker__label' id={`${id}-label`}>
          {label}
        </div>
      )}
      {props.filterable === true && (
        <TextInput
          aria-label={t('Search')}
          className='str-chat__a2ui-choice-picker__filter'
          onChange={(event) => setFilter(event.target.value)}
          placeholder={t('Search')}
          type='search'
          value={filter}
        />
      )}
      {isChips ? (
        <div className='str-chat__a2ui-choice-picker__chips'>
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <Button
                appearance='ghost'
                aria-pressed={isSelected}
                className={clsx('str-chat__a2ui-chip', {
                  'str-chat__a2ui-chip--selected': isSelected,
                })}
                key={option.value}
                onClick={() => toggle(option.value)}
                size='sm'
                variant='secondary'
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      ) : (
        <div className='str-chat__a2ui-choice-picker__options'>
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <label className='str-chat__a2ui-choice-picker__option' key={option.value}>
                <input
                  checked={isSelected}
                  className='str-chat__a2ui-choice-picker__input'
                  name={isMultiple ? undefined : id}
                  onChange={() => toggle(option.value)}
                  type={isMultiple ? 'checkbox' : 'radio'}
                  value={option.value}
                />
                <Checkbox aria-hidden checked={isSelected} />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      )}
      <Problems errors={errors} id={`${id}-problems`} />
    </div>
  );
};

// The A2UI icons Stream has one for, by the slot an app restyles it with.
const STREAM_ICONS: Record<string, keyof IconSlots> = {
  accountCircle: 'IconUser',
  add: 'IconPlus',
  arrowBack: 'IconArrowLeft',
  attachFile: 'IconAttachment',
  camera: 'IconCamera',
  check: 'IconCheckmark',
  close: 'IconXmark',
  delete: 'IconDelete',
  download: 'IconDownload',
  edit: 'IconEdit',
  error: 'IconExclamationCircleFill',
  folder: 'IconFolder',
  info: 'IconInfo',
  locationOn: 'IconLocation',
  menu: 'IconMenu',
  moreHoriz: 'IconMore',
  notifications: 'IconBell',
  notificationsOff: 'IconBellOff',
  pause: 'IconPauseFill',
  person: 'IconUser',
  photo: 'IconImage',
  play: 'IconPlayFill',
  refresh: 'IconRefresh',
  search: 'IconSearch',
  send: 'IconSend',
  upload: 'IconUpload',
  visibility: 'IconEyeFill',
  volumeMute: 'IconMute',
  volumeOff: 'IconMute',
  warning: 'IconExclamationTriangleFill',
};

// The names A2UI's own Icon gives these in the Material icon fonts.
const FONT_NAMES: Record<string, string> = {
  favoriteOff: 'favorite_border',
  play: 'play_arrow',
  rewind: 'fast_rewind',
  starOff: 'star_border',
};

const fontNameOf = (name: string) =>
  FONT_NAMES[name] ?? name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

// What a screen reader says for an icon, from its name: `shoppingCart` is "shopping cart".
const wordsOf = (name: string) => name.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

type IconProps = Weighted & { name?: unknown };

/**
 * A2UI's Icon: the app's own for its name, else Stream's, else the icon font the app loads, if
 * it said which. An icon none of them draws takes its place but shows nothing, rather than its
 * name as words. An icon the agent draws as an SVG path shows as it.
 */
export const A2UIIcon = ({ props }: ReactA2uiComponentProps<IconProps>) => {
  const engine = useContext(A2UIEngineContext);
  const streamIcons = useComponentContextIcons();
  const { part } = usePart(props);
  const classes = clsx('str-chat__a2ui-icon', part.className);
  const { name } = props;
  if (typeof name === 'object' && name !== null && 'svgPath' in name) {
    const { svgPath } = name as { svgPath?: unknown };
    // A drawn icon says nothing unless the agent named it.
    const spoken = part['aria-label']
      ? { role: 'img' }
      : { 'aria-hidden': part['aria-hidden'] ?? true };
    return (
      <svg
        {...part}
        {...spoken}
        className={classes}
        focusable={false}
        viewBox='0 0 24 24'
      >
        <path d={textOf(svgPath)} />
      </svg>
    );
  }
  const iconName = textOf(name);
  const slot = STREAM_ICONS[iconName];
  const Drawn: React.ComponentType<ComponentPropsWithoutRef<'svg'>> | undefined =
    engine?.icons?.[iconName] ?? (slot ? streamIcons[slot] : undefined);
  // Called what the agent named it, else its name in words.
  const label = { 'aria-label': part['aria-label'] ?? wordsOf(iconName), role: 'img' };
  if (Drawn) {
    return (
      <span {...part} {...label} className={classes}>
        <Drawn aria-hidden />
      </span>
    );
  }
  return (
    <span {...part} {...label} className={classes}>
      {engine?.iconFont && (
        <span
          aria-hidden
          className='str-chat__a2ui-icon__glyph'
          style={{ fontFamily: engine.iconFont }}
        >
          {fontNameOf(iconName)}
        </span>
      )}
    </span>
  );
};

type ModalProps = Weighted & { content: string; trigger: string };

// The type of a component of the surface, following it: an agent may write a component after
// the one that names it.
const useComponentType = (context: ComponentContext, id: string) => {
  const components = context.surfaceComponents;
  const subscribe = useCallback(
    (onChange: () => void) => {
      const created = components.onCreated.subscribe(onChange);
      const deleted = components.onDeleted.subscribe(onChange);
      return () => {
        created.unsubscribe();
        deleted.unsubscribe();
      };
    },
    [components],
  );
  return useSyncExternalStore(subscribe, () => components.get(id)?.type);
};

/**
 * A Modal that opens as a dialog: focus moves into it and stays there while it is open, Escape
 * and the backdrop close it, focus goes back to what opened it, and it shows above everything,
 * whatever the reply's layout. A tap on its trigger opens it, and a Button's own action still
 * runs; another trigger opens from the keyboard too.
 */
export const A2UIModal = ({
  buildChild,
  context,
  props,
}: ReactA2uiComponentProps<ModalProps>) => {
  const { t } = useTranslationContext();
  const dialog = useRef<HTMLDialogElement>(null);
  const [isOpen, setOpen] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    if (!element || isOpen === element.open) return;
    if (isOpen) {
      if (typeof element.showModal === 'function') element.showModal();
      else element.setAttribute('open', '');
    } else if (typeof element.close === 'function') element.close();
    else element.removeAttribute('open');
  }, [isOpen]);
  // The trigger as the agent named it: `props` has it as the node it rendered.
  const { trigger } = context.componentModel.properties;
  const opensItself =
    useComponentType(context, typeof trigger === 'string' ? trigger : '') === 'Button';
  const open = () => setOpen(true);
  return (
    <>
      <div
        className='str-chat__a2ui-modal__trigger'
        onClickCapture={open}
        {...(opensItself
          ? {}
          : {
              onKeyDown: (event: KeyboardEvent) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                open();
              },
              role: 'button',
              tabIndex: 0,
            })}
      >
        {buildChild(props.trigger)}
      </div>
      <dialog
        {...accessibilityOf(props)}
        className='str-chat__a2ui-modal'
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        onClose={() => setOpen(false)}
        ref={dialog}
      >
        <div className='str-chat__a2ui-modal__content'>
          <button
            aria-label={t('Close')}
            className='str-chat__a2ui-modal__close'
            onClick={() => setOpen(false)}
            type='button'
          >
            ×
          </button>
          {isOpen && buildChild(props.content)}
        </div>
      </dialog>
    </>
  );
};

/** The basic catalog's components drawn here, by their A2UI type. */
type ImageProps = Weighted & {
  description?: unknown;
  fit?: unknown;
  url?: unknown;
  variant?: unknown;
};

const FITS: Record<string, string> = { scaleDown: 'scale-down' };

/**
 * A2UI's Image, loading only what the renderer's `mediaUrl` allows, before it draws, so an
 * image the agent links to never reaches what the app doesn't want it to.
 */
export const A2UIImage = ({ props }: ReactA2uiComponentProps<ImageProps>) => {
  const { part } = usePart(props);
  const engine = useContext(A2UIEngineContext);
  const src = aiUIMediaSource(props.url, engine?.mediaURL);
  const variant = typeof props.variant === 'string' ? props.variant : 'default';
  const fit = typeof props.fit === 'string' ? (FITS[props.fit] ?? props.fit) : 'cover';
  if (!src) return null;
  return (
    <img
      {...part}
      alt={textOf(props.description)}
      className={clsx('str-chat__a2ui-image', `str-chat__a2ui-image--${variant}`)}
      src={src}
      style={{ ...part.style, objectFit: fit as CSSProperties['objectFit'] }}
    />
  );
};

type VideoProps = Weighted & { posterUrl?: unknown; url?: unknown };

/** A2UI's Video, loading only what the renderer's `mediaUrl` allows. */
export const A2UIVideo = ({ props }: ReactA2uiComponentProps<VideoProps>) => {
  const { part } = usePart(props);
  const engine = useContext(A2UIEngineContext);
  const src = aiUIMediaSource(props.url, engine?.mediaURL);
  const poster = aiUIMediaSource(props.posterUrl, engine?.mediaURL);
  if (!src) return null;
  return (
    <video
      {...part}
      className='str-chat__a2ui-video'
      controls
      poster={poster}
      preload='metadata'
      src={src}
    />
  );
};

type AudioPlayerProps = Weighted & { description?: unknown; url?: unknown };

/** A2UI's AudioPlayer, loading only what the renderer's `mediaUrl` allows. */
export const A2UIAudioPlayer = ({ props }: ReactA2uiComponentProps<AudioPlayerProps>) => {
  const { part } = usePart(props);
  const engine = useContext(A2UIEngineContext);
  const src = aiUIMediaSource(props.url, engine?.mediaURL);
  if (!src) return null;
  const description = textOf(props.description);
  return (
    <div {...part} className='str-chat__a2ui-audio-player'>
      {description && (
        <div className='str-chat__a2ui-audio-player__description'>{description}</div>
      )}
      <audio
        aria-label={description || undefined}
        controls
        preload='metadata'
        src={src}
      />
    </div>
  );
};

export const STREAM_BASIC_COMPONENTS: Record<
  string,
  (props: ReactA2uiComponentProps<never>) => ReactNode
> = {
  AudioPlayer: A2UIAudioPlayer,
  Button: A2UIButton,
  Card: A2UICard,
  ChoicePicker: A2UIChoicePicker,
  Icon: A2UIIcon,
  Image: A2UIImage,
  Modal: A2UIModal,
  Text: A2UIText,
  TextField: A2UITextField,
  Video: A2UIVideo,
};
