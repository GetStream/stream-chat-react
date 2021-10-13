import React, { useEffect } from 'react';

type Props = {
  setThemeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  themeModalOpen: boolean;
};

export const MainLogo: React.FC<Props> = (props) => {
  const { setThemeModalOpen, themeModalOpen } = props;

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (event.target instanceof HTMLElement) {
        const elements = document.getElementsByClassName('navigation-top-theme-modal');
        const themeModal = elements.item(0);

        if (!themeModal?.contains(event.target)) {
          setThemeModalOpen(false);
        }
      }
    };

    if (themeModalOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [themeModalOpen]); // eslint-disable-line

  return (
    <div className='main-logo' onClick={() => setThemeModalOpen((prev) => !prev)}>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='48'
        height='48'
        fill='none'
        viewBox='0 0 48 48'
      >
        <path
          fill='#fff'
          fillRule='evenodd'
          d='M24 1C11.297 1 1 11.297 1 24s10.297 23 23 23V1z'
          clipRule='evenodd'
        ></path>
        <path
          fill='#0E1621'
          fillRule='evenodd'
          d='M24 48c13.255 0 24-10.745 24-24S37.255 0 24 0v48z'
          clipRule='evenodd'
        ></path>
        <path
          fill='#fff'
          fillRule='evenodd'
          d='M24 40c.52-.017.968-.403 1.074-.935V34.77c.058-.581-.406-1.162-.987-1.22a.203.203 0 01-.087.053V40zm0-8.367c4.167-.016 7.576-3.436 7.576-7.607A7.709 7.709 0 0024 16.42v2.438c2.845 0 5.138 2.323 5.138 5.168 0 2.846-2.293 5.168-5.138 5.168v2.439zm0-17.183c.52-.016.968-.402 1.074-.934V9.22c.058-.58-.406-1.16-.987-1.219a.202.202 0 01-.087.053v6.397zm9.55 9.46c.116-.58.639-.987 1.22-.929h4.295c.581.116.988.639.93 1.22-.117.58-.64.987-1.22.928H34.48c-.58-.116-.987-.638-.929-1.219zm0-11.207a1.191 1.191 0 011.684 0c.522.523.522 1.278 0 1.684l-2.845 2.846a1.191 1.191 0 01-1.684-1.684l2.845-2.846zM30.764 30.82a1.191 1.191 0 011.683 0l2.845 2.845a1.192 1.192 0 01-1.684 1.684l-2.844-2.845a1.192 1.192 0 010-1.684z'
          clipRule='evenodd'
        ></path>
        <path
          fill='#0E1723'
          fillRule='evenodd'
          d='M24 8.053c-.018.005-.029.005-.029.005-.58 0-1.103.523-1.045 1.104v4.064c-.058.58.348 1.103.929 1.22.049.004.097.006.145.005V8.053zm0 8.367h-.029a7.595 7.595 0 00-7.605 7.606 7.595 7.595 0 007.605 7.607H24v-2.439c-2.845 0-5.138-2.322-5.138-5.168 0-2.845 2.293-5.167 5.138-5.167V16.42zm0 17.182c-.018.005-.029.005-.029.005-.58 0-1.103.523-1.045 1.104v4.064c-.058.58.348 1.104.929 1.22.049.005.097.006.145.005v-6.398zM9.225 22.982c-.58-.059-1.103.348-1.22.928-.058.581.349 1.104.93 1.22h4.296c.58.058 1.103-.349 1.219-.93.058-.58-.349-1.103-.93-1.219H9.226zm5.109-10.278a1.191 1.191 0 00-1.684 1.683l2.845 2.846a1.191 1.191 0 001.683-1.684l-2.844-2.845zm2.844 18.116a1.191 1.191 0 00-1.683 0l-2.845 2.845a1.191 1.191 0 001.684 1.684l2.844-2.845a1.192 1.192 0 000-1.684z'
          clipRule='evenodd'
        ></path>
      </svg>
    </div>
  );
};
