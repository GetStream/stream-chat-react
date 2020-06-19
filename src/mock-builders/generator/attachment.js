import { v4 as uuidv4 } from 'uuid';

export const generateImageAttachment = () => {
  return {
    type: 'image',
    title: uuidv4(),
    title_link: 'https://getstream.io',
    text: uuidv4(),
    image_url: uuidv4(),
    thumb_url: uuidv4(),
  };
};
