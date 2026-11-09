import React from 'react';
import clsx from 'clsx';
import { Slot } from './Slot';
import { ChatViewEmptyPlaceholder } from '../ChatViewEmptyPlaceholder';
import { hasSlotContent } from '../slotRegistry';

import type { ReactNode } from 'react';

export type WorkspaceLayoutSlot = {
  content?: ReactNode;
  slot: string;
};

export type WorkspaceLayoutProps = {
  navRail?: ReactNode;
  /**
   * The slots, each with what it shows. {@link ChatViewEmptyPlaceholder} replaces them while none
   * has content (`null`, `undefined` and booleans count as none).
   */
  slots: WorkspaceLayoutSlot[];
};

export const WorkspaceLayout = ({ navRail, slots }: WorkspaceLayoutProps) => {
  const isEmpty = !slots.some(({ content }) => hasSlotContent(content));

  return (
    <div className='str-chat__chat-view__workspace-layout'>
      {navRail ? (
        <div className='str-chat__chat-view__workspace-layout-nav-rail'>{navRail}</div>
      ) : null}
      <div
        className={clsx('str-chat__chat-view__workspace-layout-slots', {
          'str-chat__chat-view__workspace-layout-slots--empty': isEmpty,
        })}
      >
        {isEmpty ? (
          <ChatViewEmptyPlaceholder />
        ) : (
          slots.map(({ content, slot }) => (
            <Slot
              className='str-chat__chat-view__workspace-layout-slot'
              key={slot}
              slot={slot}
            >
              {content}
            </Slot>
          ))
        )}
      </div>
    </div>
  );
};
