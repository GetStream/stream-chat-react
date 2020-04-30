export const generateMember = (options = {}) => {
  return {
    user_id: options.user.id,
    user: options.user,
    is_moderator: false,
    invited: false,
    role: 'member',
    ...options,
  };
};
