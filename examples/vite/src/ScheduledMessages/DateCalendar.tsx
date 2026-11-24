import clsx from 'clsx';
import { type FocusEvent, type KeyboardEvent, type ReactNode, useRef } from 'react';
import {
  type CalendarDate,
  createCalendar,
  getLocalTimeZone,
  isToday,
} from '@internationalized/date';
import {
  type AriaButtonProps,
  mergeProps,
  useButton,
  useCalendar,
  useCalendarCell,
  useCalendarGrid,
  useLocale,
} from 'react-aria';
import { type CalendarState, useCalendarState } from 'react-stately';
import {
  asDynamicKey,
  Button,
  isDayOrMoment,
  useComponentContextIcons,
  useTranslationContext,
} from 'stream-chat-react';

const FIRST_DAY_OF_WEEK = 'mon';
const WEEKDAY_FORMAT = 'dd';

export type DateCalendarProps = {
  autoFocus: boolean;
  focusedValue: CalendarDate;
  minValue: CalendarDate;
  onBlur: (event: FocusEvent<HTMLDivElement>) => void;
  onClose: () => void;
  onFocusChange: (day: CalendarDate) => void;
  onSelect: (day: CalendarDate) => void;
  maxValue?: CalendarDate;
  value?: CalendarDate;
};

type CalendarNavButtonProps = {
  ariaButtonProps: AriaButtonProps;
  children: ReactNode;
  label: string;
};

type CalendarDayProps = {
  date: CalendarDate;
  state: CalendarState;
};

const CalendarNavButton = ({
  ariaButtonProps,
  children,
  label,
}: CalendarNavButtonProps) => {
  const ref = useRef<HTMLButtonElement>(null);
  const { buttonProps } = useButton(ariaButtonProps, ref);

  return (
    <Button
      {...buttonProps}
      appearance='ghost'
      aria-label={label}
      circular
      className='app__schedule-calendar__nav-button'
      ref={ref}
      size='sm'
      variant='secondary'
    >
      {children}
    </Button>
  );
};

const CalendarDay = ({ date, state }: CalendarDayProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const {
    buttonProps,
    cellProps,
    formattedDate,
    isDisabled,
    isOutsideVisibleRange,
    isSelected,
    isUnavailable,
  } = useCalendarCell({ date }, state, ref);

  return (
    <td {...cellProps}>
      <div
        {...buttonProps}
        className={clsx('app__schedule-calendar__day', {
          'app__schedule-calendar__day--outside-month': isOutsideVisibleRange,
          'app__schedule-calendar__day--selected': isSelected,
          'app__schedule-calendar__day--today': isToday(date, getLocalTimeZone()),
          'app__schedule-calendar__day--unavailable': isDisabled || isUnavailable,
        })}
        ref={ref}
      >
        {formattedDate}
      </div>
    </td>
  );
};

const CalendarGrid = ({ state }: { state: CalendarState }) => {
  const { tDateTimeParser } = useTranslationContext();
  const { gridProps, headerProps, weeksInMonth } = useCalendarGrid(
    { firstDayOfWeek: FIRST_DAY_OF_WEEK },
    state,
  );

  const weekIndexes = Array.from({ length: weeksInMonth }, (_, weekIndex) => weekIndex);
  const weekDays = state.getDatesInWeek(0).map((date) => {
    if (!date) return '';
    const parsedDate = tDateTimeParser(date.toDate(getLocalTimeZone()));
    return isDayOrMoment(parsedDate) ? parsedDate.format(WEEKDAY_FORMAT) : '';
  });

  return (
    <table {...gridProps} className='app__schedule-calendar__grid'>
      <thead {...headerProps}>
        <tr>
          {weekDays.map((weekDay, dayIndex) => (
            <th className='app__schedule-calendar__weekday' key={dayIndex}>
              {weekDay}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weekIndexes.map((weekIndex) => (
          <tr key={weekIndex}>
            {state
              .getDatesInWeek(weekIndex)
              .map((date, dayIndex) =>
                date ? (
                  <CalendarDay date={date} key={date.toString()} state={state} />
                ) : (
                  <td key={dayIndex} />
                ),
              )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const DateCalendar = ({
  autoFocus,
  focusedValue,
  maxValue,
  minValue,
  onBlur,
  onClose,
  onFocusChange,
  onSelect,
  value,
}: DateCalendarProps) => {
  const { t } = useTranslationContext();
  const { IconChevronLeft, IconChevronRight } = useComponentContextIcons();
  const { locale } = useLocale();

  const calendarOptions = {
    autoFocus,
    firstDayOfWeek: FIRST_DAY_OF_WEEK,
    focusedValue,
    maxValue,
    minValue,
    onChange: onSelect,
    onFocusChange,
    value,
  } as const;
  const state = useCalendarState({ ...calendarOptions, createCalendar, locale });
  const { calendarProps, nextButtonProps, prevButtonProps, title } = useCalendar(
    calendarOptions,
    state,
  );

  const closeOnEscape = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    onClose();
  };

  return (
    <div
      {...mergeProps(calendarProps, { onBlur, onKeyDown: closeOnEscape })}
      className='app__schedule-calendar'
    >
      <div className='app__schedule-calendar__header'>
        <CalendarNavButton
          ariaButtonProps={prevButtonProps}
          label={t(
            asDynamicKey(
              'viteExample.scheduledMessages.calendar.previousMonth.ariaLabel',
            ),
            'Previous month',
          )}
        >
          <IconChevronLeft />
        </CalendarNavButton>
        <span className='app__schedule-calendar__month'>{title}</span>
        <CalendarNavButton
          ariaButtonProps={nextButtonProps}
          label={t(
            asDynamicKey('viteExample.scheduledMessages.calendar.nextMonth.ariaLabel'),
            'Next month',
          )}
        >
          <IconChevronRight />
        </CalendarNavButton>
      </div>
      <CalendarGrid state={state} />
    </div>
  );
};
