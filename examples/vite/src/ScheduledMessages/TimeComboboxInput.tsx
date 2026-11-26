import clsx from 'clsx';
import {
  type KeyboardEvent,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type AriaListBoxOptions,
  I18nProvider,
  mergeProps,
  useComboBox,
  useFilter,
  useListBox,
  useOption,
} from 'react-aria';
import {
  type ComboBoxState,
  Item,
  type Key,
  type Node,
  useComboBoxState,
} from 'react-stately';
import {
  DialogAnchor,
  type ScheduleTimeInputProps,
  TextInput,
  useComponentContextIcons,
  useDialogOnNearestManager,
  useTranslationContext,
} from 'stream-chat-react';

import { getTimeOptions, parseTimeText, withTimeOption } from './dateTimeText';

const TIME_OPTION_INTERVAL_MINUTES = 15;
const FIELD_WRAPPER_SELECTOR = '.str-chat__form-text-input__wrapper';
const DEFAULT_LOCALE = 'en';

type TimeOption = { id: string };

type TimeOptionListProps = {
  listBoxProps: AriaListBoxOptions<TimeOption>;
  listBoxRef: RefObject<HTMLUListElement | null>;
  state: ComboBoxState<TimeOption>;
  width?: number;
};

type TimeOptionItemProps = {
  item: Node<TimeOption>;
  state: ComboBoxState<TimeOption>;
};

const timeOptions = getTimeOptions(TIME_OPTION_INTERVAL_MINUTES);

const renderTimeOption = ({ id }: TimeOption) => <Item key={id}>{id}</Item>;

const withoutLeadingZero = (time: string) => time.replace(/^0/, '');

const TimeOptionItem = ({ item, state }: TimeOptionItemProps) => {
  const ref = useRef<HTMLLIElement>(null);
  const { isFocused, optionProps } = useOption({ key: item.key }, state, ref);

  return (
    <li
      {...optionProps}
      className={clsx('app__schedule-time-option', {
        'app__schedule-time-option--active': isFocused,
      })}
      ref={ref}
    >
      {item.rendered}
    </li>
  );
};

const TimeOptionList = ({
  listBoxProps,
  listBoxRef,
  state,
  width,
}: TimeOptionListProps) => {
  const { listBoxProps: listBoxDomProps } = useListBox(listBoxProps, state, listBoxRef);

  useEffect(() => {
    const listBox = listBoxRef.current;
    const selectedOption = listBox?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!listBox || !selectedOption) return;
    listBox.scrollTop =
      selectedOption.offsetTop - (listBox.clientHeight - selectedOption.offsetHeight) / 2;
  }, [listBoxRef]);

  return (
    <ul
      {...listBoxDomProps}
      className='app__schedule-time-options'
      ref={listBoxRef}
      style={{ width }}
    >
      {[...state.collection].map((item) => (
        <TimeOptionItem item={item} key={item.key} state={state} />
      ))}
    </ul>
  );
};

const TimeComboboxField = ({ label, onChange, value }: ScheduleTimeInputProps) => {
  const { IconCaretDown, IconClock } = useComponentContextIcons();
  const { startsWith } = useFilter({ sensitivity: 'base' });

  const listboxId = useId();
  const dialogId = `app-schedule-time-options-${listboxId}`;
  const { dialogManager } = useDialogOnNearestManager({ id: dialogId });

  const [fieldElement, setFieldElement] = useState<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listBoxRef = useRef<HTMLUListElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const firstMatchFocusedForRef = useRef<string | null>(null);

  const matchesTypedText = useCallback(
    (time: string, text: string) =>
      startsWith(time, text) || startsWith(withoutLeadingZero(time), text),
    [startsWith],
  );

  const items = useMemo(
    () => withTimeOption(timeOptions, value).map((time) => ({ id: time })),
    [value],
  );

  const selectTime = useCallback(
    (key: Key | null) => {
      if (key !== null) onChange(String(key));
    },
    [onChange],
  );

  const commitTypedTime = useCallback(() => {
    const parsedTime = parseTimeText(inputRef.current?.value ?? '');
    if (parsedTime && parsedTime !== value) onChange(parsedTime);
  }, [onChange, value]);

  const comboBoxOptions = {
    'aria-label': label,
    defaultFilter: matchesTypedText,
    defaultItems: items,
    menuTrigger: 'focus' as const,
    onBlur: commitTypedTime,
    onSelectionChange: selectTime,
    selectedKey: value,
  };
  const state = useComboBoxState({ ...comboBoxOptions, children: renderTimeOption });
  const { inputProps, listBoxProps } = useComboBox(
    { ...comboBoxOptions, inputRef, listBoxRef, popoverRef },
    state,
  );

  const { inputValue, isOpen, selectedItem, selectionManager } = state;
  const firstMatchKey = state.collection.getFirstKey();
  const isFiltering = isOpen && inputValue !== (selectedItem?.textValue ?? '');

  const setInputElement = useCallback((element: HTMLInputElement | null) => {
    inputRef.current = element;
    setFieldElement(element?.closest<HTMLElement>(FIELD_WRAPPER_SELECTOR) ?? null);
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && isOpen) event.preventDefault();
    if (event.key === 'Enter' && selectionManager.focusedKey === null) commitTypedTime();
  };

  const openList = () => {
    if (!state.isOpen) state.open(null, 'manual');
  };

  useEffect(() => {
    if (!isFiltering || firstMatchKey === null) {
      firstMatchFocusedForRef.current = null;
      return;
    }
    if (firstMatchFocusedForRef.current === inputValue) return;
    firstMatchFocusedForRef.current = inputValue;
    selectionManager.setFocusedKey(firstMatchKey);
  }, [firstMatchKey, inputValue, isFiltering, selectionManager]);

  useEffect(() => {
    if (!dialogManager) return;
    if (isOpen) dialogManager.open({ id: dialogId });
    else dialogManager.close(dialogId);
  }, [dialogId, dialogManager, isOpen]);

  useEffect(() => () => dialogManager?.close(dialogId), [dialogId, dialogManager]);

  return (
    <>
      <TextInput
        {...mergeProps(inputProps, { onClick: openList, onKeyDown: handleKeyDown })}
        className={clsx('app__schedule-field', {
          'app__schedule-field--open': isOpen,
        })}
        label={label}
        leading={<IconClock />}
        ref={setInputElement}
        required
        trailing={<IconCaretDown />}
      />
      <DialogAnchor
        allowFlip
        className='app__schedule-time-popover'
        closeOnClickOutside={false}
        closeOnEscape={false}
        data-react-aria-top-layer
        dialogManagerId={dialogManager?.id}
        focus={false}
        id={dialogId}
        offset={4}
        placement='bottom-start'
        referenceElement={fieldElement}
        tabIndex={-1}
        updateKey={state.collection.size}
      >
        <div ref={popoverRef}>
          <TimeOptionList
            listBoxProps={listBoxProps}
            listBoxRef={listBoxRef}
            state={state}
            width={fieldElement?.offsetWidth}
          />
        </div>
      </DialogAnchor>
    </>
  );
};

/** The Figma time field: a list of times every 15 minutes that narrows as a time is typed. */
export const TimeComboboxInput = (props: ScheduleTimeInputProps) => {
  const { userLanguage } = useTranslationContext();
  return (
    <I18nProvider locale={userLanguage || DEFAULT_LOCALE}>
      <TimeComboboxField {...props} />
    </I18nProvider>
  );
};
