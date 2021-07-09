import React from 'react';

export const MainLogo: React.FC = () => (
  <div className='main-logo'>
    <svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' fill='none' viewBox='0 0 48 48'>
      <path
        fill='#131D8C'
        d='M25.111 30.78c0-3.34 2.349-7.403 5.242-9.068l8.151-4.69c.827-.475 1.496-.087 1.496.867v9.483c0 3.37-2.386 7.465-5.303 9.104l-8.11 4.556c-.819.46-1.476.07-1.476-.875v-9.376z'
      ></path>
      <path
        fill='#006CFF'
        d='M8.497 17.916c0-.965.688-1.358 1.53-.874l8.158 4.694c2.883 1.66 5.2 5.65 5.2 8.955v9.44c0 .955-.675 1.35-1.507.883l-8.116-4.558c-2.909-1.633-5.265-5.657-5.265-8.99v-9.55z'
      ></path>
      <g filter='url(#filter0_b)'>
        <path
          fill='#ED5D2E'
          d='M15.862 18.178c-2.884-1.66-2.884-5.823 0-7.482l7.526-4.33a1.726 1.726 0 011.722 0l7.526 4.33c2.884 1.66 2.884 5.822 0 7.482l-7.524 4.328a1.73 1.73 0 01-1.726 0l-7.524-4.328z'
        ></path>
      </g>
      <defs>
        <filter
          id='filter0_b'
          width='23.073'
          height='18.574'
          x='12.713'
          y='5.149'
          colorInterpolationFilters='sRGB'
          filterUnits='userSpaceOnUse'
        >
          <feFlood floodOpacity='0' result='BackgroundImageFix'></feFlood>
          <feGaussianBlur in='BackgroundImage' stdDeviation='0.493'></feGaussianBlur>
          <feComposite
            in2='SourceAlpha'
            operator='in'
            result='effect1_backgroundBlur'
          ></feComposite>
          <feBlend in='SourceGraphic' in2='effect1_backgroundBlur' result='shape'></feBlend>
        </filter>
      </defs>
    </svg>
  </div>
);
