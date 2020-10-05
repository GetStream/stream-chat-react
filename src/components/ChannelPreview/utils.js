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
  const title = channel.data.name;

  if (title) {
    return title;
  }
  const members = Object.values(channel.state.members);
  const otherMembers = members.filter((m) => m.user.id !== currentUser.id);
  return otherMembers
    .map((member) => member.user.name || member.user.id || 'Unnamed User')
    .join(', ');
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

export const getGroupImages = (channel, currentUser) => {
  const { image } = channel.data;
  const members = Object.values(channel.state.members);
  let images = [];
  if (!image) {
    images = members
      .map((mem) => {
        if (mem.user.id !== currentUser.id) {
          return mem.user.image;
        }
        return null;
      })
      .filter((img) => !!img)
      .slice(0, 4);
  }

  return images;
};
