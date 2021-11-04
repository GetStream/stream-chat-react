import React from 'react';
import { AnimatePresence, motion, Variants } from 'framer-motion';

import { useEventContext } from '../contexts/EventContext';

export const OverviewButton: React.FC = () => {
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
    setVideoOpen(false);
    setSelected('overview');
    setEventName(undefined);
    setChatType('global');
    if (showChannelList) setShowChannelList(false);
  };

  const variants: Variants = {
    open: { opacity: 1, x: 0 },
    closed: { opacity: 0, x: -10 },
  };

  return (
    <div>
      <AnimatePresence>
        {selected === 'overview' ? (
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
          fill={`${selected === 'overview' ? 'var(--primary-accent)' : 'var(--text-mid-emphasis)'}`}
          fillRule='evenodd'
          d='M43.707 25.707A1 1 0 0044 25v-5h3L36.673 6.26a1 1 0 00-1.346 0L25 20h3v5a1 1 0 001 1h14a1 1 0 00.707-.293zM35 18a1 1 0 00-1 1v4a1 1 0 001 1h2a1 1 0 001-1v-4a1 1 0 00-1-1h-2z'
          clipRule='evenodd'
        ></path>
        <path
          fill={`${selected === 'overview' ? 'var(--primary-accent)' : 'var(--text-mid-emphasis)'}`}
          d='M19.2 43c0-2.531-1.485-4.11-3.531-4.11-2.047 0-3.532 1.579-3.532 4.11 0 2.531 1.485 4.11 3.531 4.11 2.047 0 3.532-1.579 3.532-4.11zm-.938 0c0 2.078-1.14 3.203-2.594 3.203-1.453 0-2.593-1.125-2.593-3.203s1.14-3.203 2.594-3.203c1.453 0 2.593 1.125 2.593 3.203zm7.348-2h-1l-1.656 4.781h-.063L21.235 41h-1l2.219 6h.937l2.219-6zm3.517 6.125c1.22 0 2.11-.61 2.391-1.516l-.89-.25c-.235.625-.778.938-1.5.938-1.083 0-1.829-.7-1.872-1.984h4.356v-.391c0-2.234-1.328-3-2.578-3-1.625 0-2.703 1.281-2.703 3.125s1.062 3.078 2.796 3.078zm-1.87-3.61c.062-.933.722-1.765 1.777-1.765 1 0 1.64.75 1.64 1.766h-3.418zM33.013 47h.922v-3.797c0-.812.64-1.406 1.516-1.406.246 0 .5.047.562.062v-.937a8.872 8.872 0 00-.484-.016c-.719 0-1.344.407-1.563 1h-.062V41h-.89v6zm9.182-6h-1l-1.656 4.781h-.063L37.821 41h-1l2.219 6h.937l2.219-6zm1.217 6h.922v-6h-.922v6zm.468-7c.36 0 .657-.281.657-.625s-.297-.625-.657-.625c-.359 0-.656.281-.656.625s.297.625.656.625zm4.658 7.125c1.218 0 2.109-.61 2.39-1.516l-.89-.25c-.235.625-.778.938-1.5.938-1.083 0-1.829-.7-1.872-1.984h4.356v-.391c0-2.234-1.328-3-2.578-3-1.625 0-2.703 1.281-2.703 3.125s1.062 3.078 2.797 3.078zm-1.872-3.61c.063-.933.723-1.765 1.778-1.765 1 0 1.64.75 1.64 1.766h-3.418zM53.785 47h.906l1.312-4.61h.094L57.41 47h.906l1.828-6h-.969l-1.297 4.578h-.062L56.55 41h-.984l-1.281 4.594h-.063L52.925 41h-.968l1.828 6z'
        ></path>
      </svg>
    </div>
  );
};
