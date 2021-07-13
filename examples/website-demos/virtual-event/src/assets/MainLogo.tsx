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
        width='32'
        height='32'
        fill='none'
        viewBox='0 0 32 32'
      >
        <mask id='mask0' width='32' height='32' x='0' y='0' maskUnits='userSpaceOnUse'>
          <path
            fill='#0E1621'
            d='M15.971.058c-.58 0-1.103.523-1.045 1.103V5.226c-.058.58.348 1.103.929 1.22.58.057 1.103-.35 1.219-.93V1.22C17.132.64 16.668.06 16.087 0c-.058.058-.116.058-.116.058zm0 8.362a7.595 7.595 0 00-7.605 7.606 7.595 7.595 0 007.605 7.607c4.18 0 7.605-3.426 7.605-7.607a7.709 7.709 0 00-7.605-7.606zm0 2.438a5.179 5.179 0 015.167 5.168 5.179 5.179 0 01-5.167 5.168V10.858zM1.225 14.981c-.58-.058-1.103.348-1.22.93-.058.58.349 1.102.93 1.219H5.23c.58.058 1.103-.349 1.219-.93.058-.58-.349-1.103-.93-1.219H1.226zm25.544 0c-.58-.058-1.103.348-1.219.93-.058.58.349 1.102.93 1.219h4.295c.58.058 1.103-.349 1.22-.93.058-.58-.349-1.103-.93-1.219H26.77zM15.971 25.607c-.58 0-1.103.523-1.045 1.104v4.064c-.058.58.348 1.103.929 1.22.58.058 1.103-.349 1.219-.93V26.77c.058-.581-.406-1.162-.987-1.22-.058.058-.116.058-.116.058zM27.234 4.703a1.191 1.191 0 00-1.684 0L22.705 7.55a1.192 1.192 0 001.684 1.684l2.845-2.846c.522-.406.522-1.161 0-1.684.058.058.058.058 0 0zm-20.9 0A1.191 1.191 0 004.65 6.387l2.845 2.846a1.191 1.191 0 001.683-1.684L6.334 4.703zM24.447 22.82a1.191 1.191 0 00-1.683 1.684l2.844 2.845a1.191 1.191 0 001.684-1.684l-2.845-2.845zm-15.269 0a1.191 1.191 0 00-1.683 0L4.65 25.665a1.192 1.192 0 001.684 1.684l2.844-2.845a1.192 1.192 0 000-1.684z'
          ></path>
        </mask>
        <g mask='url(#mask0)'>
          <path
            fill='url(#paint0_linear)'
            d='M31.973 0.027H37.306V32.027H31.973z'
            transform='rotate(90 31.973 .027)'
          ></path>
          <path
            fill='url(#paint1_linear)'
            d='M31.973 5.36H37.306V37.36H31.973z'
            transform='rotate(90 31.973 5.36)'
          ></path>
          <path
            fill='url(#paint2_linear)'
            d='M31.973 10.693H37.306V42.693H31.973z'
            transform='rotate(90 31.973 10.693)'
          ></path>
          <path
            fill='url(#paint3_linear)'
            d='M31.973 16.027H37.306V48.027H31.973z'
            transform='rotate(90 31.973 16.027)'
          ></path>
          <path
            fill='url(#paint4_linear)'
            d='M31.973 21.307H37.306V53.307H31.973z'
            transform='rotate(90 31.973 21.307)'
          ></path>
          <path
            fill='url(#paint5_linear)'
            d='M31.973 26.64H37.306V58.64H31.973z'
            transform='rotate(90 31.973 26.64)'
          ></path>
        </g>
        <defs>
          <linearGradient
            id='paint0_linear'
            x1='34.64'
            x2='34.64'
            y1='0.027'
            y2='32.027'
            gradientUnits='userSpaceOnUse'
          >
            <stop stopColor='#61BB46'></stop>
            <stop offset='1' stopColor='#56A53E'></stop>
          </linearGradient>
          <linearGradient
            id='paint1_linear'
            x1='34.64'
            x2='34.64'
            y1='5.36'
            y2='37.36'
            gradientUnits='userSpaceOnUse'
          >
            <stop stopColor='#FDB827'></stop>
            <stop offset='1' stopColor='#E7A825'></stop>
          </linearGradient>
          <linearGradient
            id='paint2_linear'
            x1='34.64'
            x2='34.64'
            y1='10.693'
            y2='42.693'
            gradientUnits='userSpaceOnUse'
          >
            <stop stopColor='#F5821F'></stop>
            <stop offset='1' stopColor='#D9731B'></stop>
          </linearGradient>
          <linearGradient
            id='paint3_linear'
            x1='34.64'
            x2='34.64'
            y1='16.027'
            y2='48.027'
            gradientUnits='userSpaceOnUse'
          >
            <stop stopColor='#E03A3E'></stop>
            <stop offset='1' stopColor='#BA3033'></stop>
          </linearGradient>
          <linearGradient
            id='paint4_linear'
            x1='34.64'
            x2='34.64'
            y1='21.307'
            y2='53.307'
            gradientUnits='userSpaceOnUse'
          >
            <stop stopColor='#963D97'></stop>
            <stop offset='1' stopColor='#743075'></stop>
          </linearGradient>
          <linearGradient
            id='paint5_linear'
            x1='34.64'
            x2='34.64'
            y1='26.64'
            y2='58.64'
            gradientUnits='userSpaceOnUse'
          >
            <stop stopColor='#009DDC'></stop>
            <stop offset='1' stopColor='#007EB0'></stop>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
