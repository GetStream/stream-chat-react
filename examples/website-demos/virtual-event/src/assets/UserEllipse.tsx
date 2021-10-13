import React from 'react';

type Props = {
  setActionsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};
export const UserEllipse: React.FC<Props> = ({ setActionsOpen }) => {
  const handleClick: React.MouseEventHandler<SVGSVGElement> = (event) => {
    event.stopPropagation();
    setActionsOpen((prev) => !prev);
  };

  return (
    <svg
      className='search-result-ellipse'
      onClick={handleClick}
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      fill='none'
      viewBox='0 0 16 16'
    >
      <path
        fill='var(--text-high-emphasis)'
        fillRule='evenodd'
        d='M16 8a2 2 0 11-4 0 2 2 0 014 0zM10 8a2 2 0 11-4 0 2 2 0 014 0zM4 8a2 2 0 11-4 0 2 2 0 014 0z'
        clipRule='evenodd'
      ></path>
    </svg>
  );
};
