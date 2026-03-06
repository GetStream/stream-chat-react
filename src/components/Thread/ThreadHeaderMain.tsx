import { useTranslationContext } from '../../context';
import React from 'react';
import { ToggleSidebarButton } from '../Button/ToggleSidebarButton';
import { useThreadContext } from '../Threads';
import { useStateStore } from '../../store';
import type { ThreadState } from 'stream-chat';
import { IconLayoutAlignLeft } from '../Icons';

const threadStateSelector = ({ replyCount }: ThreadState) => ({ replyCount });

export type ThreadHeaderMainProps = {
  /** UI component to display menu icon, defaults to IconLayoutAlignLeft*/
  MenuIcon?: React.ComponentType;
  /** Set title manually */
  title?: string;
};

/**
 * This header is the default header rendered for Thread in 'threads' chat view.
 * It provides layout control capabilities - toggling sidebar open / close.
 * The purpose is to provide layout control for the main message list in threads view.
 */
export const ThreadHeaderMain = ({
  MenuIcon = IconLayoutAlignLeft,
  title,
}: ThreadHeaderMainProps) => {
  const { t } = useTranslationContext('ThreadHeader');
  const thread = useThreadContext();

  const { replyCount } = useStateStore(thread?.state, threadStateSelector) ?? {
    replyCount: 0,
  };

  return (
    <div className='str-chat__thread-header--main'>
      <ToggleSidebarButton mode='expand'>
        <MenuIcon />
      </ToggleSidebarButton>
      <div className='str-chat__thread-header--main__details'>
        <div className='str-chat__thread-header--main__title'>{title ?? t('Thread')}</div>
        <div className='str-chat__thread-header--main__subtitle'>
          {t('replyCount', { count: replyCount })}
        </div>
      </div>
    </div>
  );
};
