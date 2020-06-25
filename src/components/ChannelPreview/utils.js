export const getLatestMessagePreview = (channel, t) => {
  const latestMessage =
    channel.state.messages[channel.state.messages.length - 1];

  if (!latestMessage) {
    return t('Nothing yet...');
  }
  if (latestMessage.deleted_at) {
    return t('Message deleted');
  }
  if (latestMessage.text) {
    return latestMessage.text;
  }
  if (latestMessage.command) {
    return `/${latestMessage.command}`;
  }
  if (latestMessage.attachments.length) {
    return t('🏙 Attachment...');
  }

  return t('Empty message...');
};

export const getDisplayTitle = (channel, currentUser) => {
  let title = channel.data.name;
  const members = Object.values(channel.state.members);

  if (!title && members.length === 2) {
    const otherMember = members.find((m) => m.user.id !== currentUser.id);
    title = otherMember.user.name;
  }

  return title;
};

export const getDisplayImage = (channel, currentUser) => {
  let { image } = channel.data;
  const members = Object.values(channel.state.members);

  if (!image && members.length === 2) {
    const otherMember = members.find((m) => m.user.id !== currentUser.id);
    image = otherMember.user.image;
  }

  return image;
};
