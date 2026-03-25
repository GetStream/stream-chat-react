import { mockedApiResponse } from './utils';

interface ErrorObject {
  duration?: number;
  exception_fields?: Record<string, string>;
  message?: string;
}

const defaultErrorObject: ErrorObject = {
  duration: 0.01,
  exception_fields: {},
  message: 'API resulted in error',
};

export const erroredGetApi = (customError: ErrorObject = {}) => {
  const error = {
    ...defaultErrorObject,
    ...customError,
  };

  return mockedApiResponse(error, 'get', 500);
};

export const erroredPostApi = (customError: ErrorObject = {}) => {
  const error = {
    ...defaultErrorObject,
    ...customError,
  };

  return mockedApiResponse(error, 'post', 500);
};

export const erroredPutApi = (customError: ErrorObject = {}) => {
  const error = {
    ...defaultErrorObject,
    ...customError,
  };

  return mockedApiResponse(error, 'put', 500);
};

export const erroredDeleteApi = (customError: ErrorObject = {}) => {
  const error = {
    ...defaultErrorObject,
    ...customError,
  };

  return mockedApiResponse(error, 'delete', 500);
};
