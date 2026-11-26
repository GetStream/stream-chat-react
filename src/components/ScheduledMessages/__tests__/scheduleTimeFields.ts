import { fireEvent, screen } from '@testing-library/react';

export const getDateField = () => screen.getByLabelText('Date');

export const getTimeField = () => screen.getByLabelText('Time');

export const enterDate = (value: string) => {
  fireEvent.change(getDateField(), { target: { value } });
};

export const enterTime = (value: string) => {
  fireEvent.change(getTimeField(), { target: { value } });
};
