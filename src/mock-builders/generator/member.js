export const generateMember = (options = {}) => ({
  invited: false,
  is_moderator: false,
  role: 'member',
  user: options.user,
  user_id: options.user.id,
  ...options,
});
