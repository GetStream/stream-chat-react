import React from 'react';
import { AnimatePresence, motion, Variants } from 'framer-motion';

import { useEventContext } from '../contexts/EventContext';

export const RoomsButton: React.FC = () => {
  const {
    selected,
    setChatType,
    setEventName,
    setSelected,
    setShowChannelList,
    setVideoOpen,
    showChannelList,
  } = useEventContext();

  const handleClick = () => {
    setSelected('rooms');
    setEventName(undefined);
    setChatType('global');
    setVideoOpen(false);
    if (showChannelList) setShowChannelList(false);
  };

  const variants: Variants = {
    open: { opacity: 1, x: 0 },
    closed: { opacity: 0, x: -10 },
  };

  return (
    <div>
      <AnimatePresence>
        {selected === 'rooms' ? (
          <motion.div
            className='selected'
            variants={variants}
            initial='closed'
            animate='open'
            exit='closed'
          />
        ) : null}
      </AnimatePresence>
      <svg
        onClick={handleClick}
        xmlns='http://www.w3.org/2000/svg'
        width='72'
        height='53'
        fill='none'
        viewBox='0 0 72 53'
      >
        <path
          fill={`${selected === 'rooms' ? 'var(--primary-accent)' : 'var(--text-mid-emphasis)'}`}
          fillRule='evenodd'
          d='M36 15a4 4 0 100-8 4 4 0 000 8zm-5.5-7a3.5 3.5 0 100 7 1 1 0 100-2 1.5 1.5 0 010-3 1 1 0 100-2zM29 23a7 7 0 1113.903 1.167C42.603 25.958 38 26.5 36 26.5s-6.581-.425-6.902-2.33A7.05 7.05 0 0129 23zm-.146-5.227a1 1 0 00-1.26-1.554 6.988 6.988 0 00-2.496 6.61 1 1 0 001.972-.332 4.988 4.988 0 011.784-4.725zM45.5 11.5A3.5 3.5 0 0042 8a1 1 0 100 2 1.5 1.5 0 010 3 1 1 0 100 2 3.5 3.5 0 003.5-3.5zm-2.13 6.273a1 1 0 011.26-1.554 6.989 6.989 0 012.497 6.61 1 1 0 11-1.972-.332 4.988 4.988 0 00-1.784-4.725z'
          clipRule='evenodd'
        ></path>
        <path
          fill={`${selected === 'rooms' ? 'var(--primary-accent)' : 'var(--text-mid-emphasis)'}`}
          d='M19.266 47h.968v-3.125h1.75c.07 0 .137 0 .203-.004L23.875 47H25l-1.809-3.305c1.02-.347 1.497-1.18 1.497-2.242 0-1.414-.844-2.453-2.72-2.453h-2.702v8zm.968-4v-3.14h1.703c1.297 0 1.797.632 1.797 1.593S23.234 43 21.954 43h-1.72zm8.316 4.125c1.625 0 2.719-1.234 2.719-3.094 0-1.875-1.094-3.11-2.72-3.11-1.624 0-2.718 1.235-2.718 3.11 0 1.86 1.094 3.094 2.719 3.094zm0-.828c-1.235 0-1.797-1.063-1.797-2.266s.562-2.281 1.797-2.281c1.234 0 1.797 1.078 1.797 2.281s-.563 2.266-1.797 2.266zm6.563.828c1.625 0 2.719-1.234 2.719-3.094 0-1.875-1.094-3.11-2.719-3.11-1.625 0-2.718 1.235-2.718 3.11 0 1.86 1.093 3.094 2.718 3.094zm0-.828c-1.234 0-1.797-1.063-1.797-2.266s.563-2.281 1.797-2.281c1.235 0 1.797 1.078 1.797 2.281s-.562 2.266-1.797 2.266zM39.24 47h.922v-3.75c0-.879.64-1.5 1.36-1.5.699 0 1.187.457 1.187 1.14V47h.938v-3.906c0-.774.484-1.344 1.328-1.344.656 0 1.218.348 1.218 1.234V47h.922v-4.016c0-1.41-.758-2.062-1.828-2.062-.86 0-1.488.394-1.797 1.016h-.062c-.297-.641-.82-1.016-1.61-1.016-.78 0-1.359.375-1.609 1.016h-.078V41h-.89v6zm13.81-4.656c-.288-.852-.937-1.422-2.124-1.422-1.266 0-2.203.719-2.203 1.734 0 .828.492 1.383 1.593 1.64l1 .235c.606.14.891.43.891.844 0 .516-.547.938-1.406.938-.754 0-1.227-.325-1.39-.97l-.876.22c.215 1.019 1.055 1.562 2.281 1.562 1.395 0 2.344-.762 2.344-1.797 0-.836-.523-1.363-1.594-1.625l-.89-.219c-.711-.175-1.031-.414-1.031-.875 0-.515.546-.89 1.28-.89.806 0 1.138.445 1.298.86l.828-.235z'
        ></path>
      </svg>
    </div>
  );
};
