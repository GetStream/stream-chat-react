import type { ComponentContextValue } from '../../context';

export const extractDisplayInfo: NonNullable<
  ComponentContextValue['extractDisplayInfo']
> = ({ user }) => ({
  id: user?.id,
  imageUrl: user?.image,
  userName: user?.name, // || user?.id,
});
