import clsx from 'clsx';
import {
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { type CalendarDate, parseDate } from '@internationalized/date';
import { I18nProvider } from 'react-aria';
import {
  DialogAnchor,
  type ScheduleDateInputProps,
  TextInput,
  useComponentContextIcons,
  useDialogIsOpen,
  useDialogOnNearestManager,
  useTranslationContext,
} from 'stream-chat-react';

import { DateCalendar } from './DateCalendar';
import { fromDateValue, parseDateText } from './dateTimeText';

const FIELD_WRAPPER_SELECTOR = '.str-chat__form-text-input__wrapper';
const FOCUSED_DAY_SELECTOR = '[role="grid"] [tabindex="0"]';
const DEFAULT_LOCALE = 'en';

const toCalendarDate = (dateValue?: string) => {
  try {
    return dateValue ? parseDate(dateValue) : undefined;
  } catch {
    return undefined;
  }
};

const isFocusWithin = (element: Element | null, target: EventTarget | null) =>
  !!element && target instanceof Node && element.contains(target);

const CalendarDateField = ({
  label,
  max,
  min,
  onChange,
  value,
}: ScheduleDateInputProps) => {
  const { t, userLanguage } = useTranslationContext();
  const { IconCalendar, IconCaretDown } = useComponentContextIcons();
  const locale = userLanguage || DEFAULT_LOCALE;

  const calendarId = useId();
  const dialogId = `app-schedule-date-calendar-${calendarId}`;
  const { dialog, dialogManager } = useDialogOnNearestManager({ id: dialogId });
  const isOpen = useDialogIsOpen(dialogId, dialogManager?.id);

  const [typedText, setTypedText] = useState<string>();
  const [browsedMonthDay, setBrowsedMonthDay] = useState<CalendarDate>();
  const [shouldFocusCalendar, setShouldFocusCalendar] = useState(false);
  const [fieldElement, setFieldElement] = useState<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const earliestDate = fromDateValue(min);
  const typedDateValue =
    typedText !== undefined && earliestDate
      ? parseDateText(typedText, locale, earliestDate)
      : undefined;
  const selectedDate = fromDateValue(value);
  const displayValue = selectedDate
    ? t('timestamp.ScheduleDate', { timestamp: selectedDate })
    : '';
  const minValue = useMemo(() => toCalendarDate(min), [min]);
  const maxValue = useMemo(() => toCalendarDate(max), [max]);
  const calendarValue = useMemo(
    () => toCalendarDate(typedDateValue ?? value),
    [typedDateValue, value],
  );
  const focusedValue = browsedMonthDay ?? calendarValue ?? minValue;

  const setInputElement = useCallback((element: HTMLInputElement | null) => {
    inputRef.current = element;
    setFieldElement(element?.closest<HTMLElement>(FIELD_WRAPPER_SELECTOR) ?? null);
  }, []);

  const openCalendar = useCallback(
    (focusCalendar: boolean) => {
      setShouldFocusCalendar(focusCalendar);
      setBrowsedMonthDay(undefined);
      dialog.open();
    },
    [dialog],
  );

  const closeCalendar = useCallback(() => {
    setTypedText(undefined);
    dialog.close();
  }, [dialog]);

  const commitTypedDate = useCallback(() => {
    if (typedDateValue && typedDateValue !== value) onChange(typedDateValue);
    setTypedText(undefined);
  }, [onChange, typedDateValue, value]);

  const selectDay = useCallback(
    (day: CalendarDate) => {
      onChange(day.toString());
      closeCalendar();
      inputRef.current?.focus();
    },
    [closeCalendar, onChange],
  );

  const handleInputChange = useCallback(
    ({ target }: ChangeEvent<HTMLInputElement>) => {
      setTypedText(target.value);
      setBrowsedMonthDay(undefined);
      if (!isOpen) openCalendar(false);
    },
    [isOpen, openCalendar],
  );

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (!isOpen) {
          openCalendar(true);
          return;
        }
        calendarRef.current?.querySelector<HTMLElement>(FOCUSED_DAY_SELECTOR)?.focus();
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        commitTypedDate();
        dialog.close();
        return;
      }
      if (event.key === 'Escape' && (isOpen || typedText !== undefined)) {
        event.preventDefault();
        closeCalendar();
      }
    },
    [closeCalendar, commitTypedDate, dialog, isOpen, openCalendar, typedText],
  );

  const handleInputBlur = useCallback(
    ({ relatedTarget }: FocusEvent<HTMLInputElement>) => {
      if (isFocusWithin(calendarRef.current, relatedTarget)) return;
      commitTypedDate();
      dialog.close();
    },
    [commitTypedDate, dialog],
  );

  const handleCalendarBlur = useCallback(
    ({ currentTarget, relatedTarget }: FocusEvent<HTMLDivElement>) => {
      if (isFocusWithin(currentTarget, relatedTarget)) return;
      if (relatedTarget === inputRef.current) return;
      closeCalendar();
    },
    [closeCalendar],
  );

  const returnFocusToInput = useCallback(() => {
    closeCalendar();
    inputRef.current?.focus();
  }, [closeCalendar]);

  useEffect(() => () => dialogManager?.close(dialogId), [dialogId, dialogManager]);

  return (
    <>
      <TextInput
        aria-autocomplete='none'
        aria-controls={isOpen ? calendarId : undefined}
        aria-expanded={isOpen}
        aria-haspopup='dialog'
        autoComplete='off'
        className={clsx('app__schedule-field', { 'app__schedule-field--open': isOpen })}
        label={label}
        leading={<IconCalendar />}
        onBlur={handleInputBlur}
        onChange={handleInputChange}
        onClick={() => {
          if (!isOpen) openCalendar(false);
        }}
        onKeyDown={handleInputKeyDown}
        ref={setInputElement}
        required
        role='combobox'
        trailing={<IconCaretDown />}
        value={typedText ?? displayValue}
      />
      <DialogAnchor
        allowFlip
        aria-label={label}
        className='app__schedule-calendar-popover'
        closeOnClickOutside={false}
        closeOnEscape={false}
        dialogManagerId={dialogManager?.id}
        focus={false}
        id={dialogId}
        offset={8}
        placement='bottom-start'
        referenceElement={fieldElement}
        role='dialog'
        tabIndex={-1}
      >
        {minValue && focusedValue && (
          <div
            className='app__schedule-calendar-frame'
            id={calendarId}
            ref={calendarRef}
            style={{ width: fieldElement?.offsetWidth }}
          >
            <DateCalendar
              autoFocus={shouldFocusCalendar}
              focusedValue={focusedValue}
              maxValue={maxValue}
              minValue={minValue}
              onBlur={handleCalendarBlur}
              onClose={returnFocusToInput}
              onFocusChange={setBrowsedMonthDay}
              onSelect={selectDay}
              value={calendarValue}
            />
          </div>
        )}
      </DialogAnchor>
    </>
  );
};

/** The Figma date field: typing a date, or picking it from a calendar that starts on Monday. */
export const CalendarDateInput = (props: ScheduleDateInputProps) => {
  const { userLanguage } = useTranslationContext();
  return (
    <I18nProvider locale={userLanguage || DEFAULT_LOCALE}>
      <CalendarDateField {...props} />
    </I18nProvider>
  );
};
