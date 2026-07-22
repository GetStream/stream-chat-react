import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Channel } from 'stream-chat';

import type { PluggableList } from 'unified';
import { htmlToTextPlugin, imageToLink, plusPlusToEmphasis } from '../Message';
import remarkGfm from 'remark-gfm';

const remarkPlugins: PluggableList = [
  htmlToTextPlugin,
  [remarkGfm, { singleTilde: false }],
  plusPlusToEmphasis,
  imageToLink,
];

export const renderPreviewText = (text: string) => (
  <ReactMarkdown remarkPlugins={remarkPlugins} skipHtml>
    {text}
  </ReactMarkdown>
);

export type GroupChannelDisplayInfoMember = {
  imageUrl?: string;
  userName?: string;
};

export type GroupChannelDisplayInfo = {
  members: GroupChannelDisplayInfoMember[];
  /** When members.length > 4, count for the "+N" badge (members.length - 2). */
  overflowCount?: number;
};

/**
 * Channel display image: channel.data.image, or for DM (2 members) the other member's user.image.
 */
export const getChannelDisplayImage = (
  channel: Channel,
  currentUserId?: string,
): string | undefined => {
  const data = channel.data as { image?: string } | undefined;
  if (data?.image && typeof data.image === 'string') return data.image;

  const memberList = Object.values(channel.state.members);
  if (memberList.length === 2) {
    const other = memberList.find((m) => m.user?.id !== currentUserId);
    const image = other?.user?.image;
    if (image && typeof image === 'string') return image;
  }
  return undefined;
};

export const getGroupChannelDisplayInfo = (
  channel: Channel,
): GroupChannelDisplayInfo | undefined => {
  const members = Object.values(channel.state.members);
  if (members.length <= 2) return;

  const memberList: GroupChannelDisplayInfoMember[] = [];
  for (const member of members) {
    const { user } = member;
    if (!user?.name && !user?.image) continue;
    memberList.push({ imageUrl: user.image, userName: user.name });
  }
  return {
    members: memberList,
  };
};
