import { nanoid } from 'nanoid';

const generateFile = (data = {}) => {
  const date = new Date();
  return {
    lastModified: +date,
    lastModifiedDate: date,
    name: nanoid(),
    size: 10,
    type: 'file',
    uri: null,
    ...data,
  };
};

export const generateUpload = ({ fileOverrides = {}, objectOverrides = {} } = {}) => ({
  file: generateFile(fileOverrides),
  id: nanoid(),
  state: 'uploading',
  url: 'url',
  ...objectOverrides,
});
