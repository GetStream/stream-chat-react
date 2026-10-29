const padTwoDigits = (value: number) => String(value).padStart(2, '0');

export const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = padTwoDigits(date.getMonth() + 1);
  const day = padTwoDigits(date.getDate());

  const dateInputValue = `${year}-${month}-${day}`;

  return dateInputValue;
};

export const toTimeInputValue = (date: Date) => {
  const hours = padTwoDigits(date.getHours());
  const minutes = padTwoDigits(date.getMinutes());

  const timeInputValue = `${hours}:${minutes}`;

  return timeInputValue;
};

export const fromDateAndTimeInputValues = (dateValue: string, timeValue: string) => {
  if (!dateValue || !timeValue) return undefined;

  const scheduledAt = new Date(`${dateValue}T${timeValue}`);

  const isValidDate = !Number.isNaN(scheduledAt.getTime());

  return isValidDate ? scheduledAt : undefined;
};
