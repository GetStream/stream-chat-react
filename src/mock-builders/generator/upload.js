import { nanoid } from 'nanoid';

export const generateUpload = ({ fileOverrides = {}, objectOverrides = {} } = {}) => {
  const date = new Date();

  return {
    file: {
      lastModified: +date,
      lastModifiedDate: date,
      name: nanoid(),
      size: 10,
      type: 'file',
      uri: null,
      ...fileOverrides,
    },
    id: nanoid(),
    state: 'uploading',
    url: 'url',
    ...objectOverrides,
  };
};
