import type { ComponentPropsWithoutRef } from 'react';
import React from 'react';
import clsx from 'clsx';

export type IconTypeV2 = 'standard' | 'alt';

export type IconProps = {
  mimeType?: string;
  size?: number;
  type?: IconTypeV2;
} & ComponentPropsWithoutRef<'svg'>;

const DEFAULT_SIZE = 40;

export const FilePdfIcon = ({
  className = '',
  size = DEFAULT_SIZE,
  ...props
}: IconProps) => (
  <svg
    className={clsx('rfu-file-pdf', className)}
    fill='none'
    height={size}
    viewBox='0 0 34 40'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M0 3C0 1.34315 1.34315 0 3 0H23L34 11V37C34 38.6569 32.6569 40 31 40H3C1.34315 40 0 38.6569 0 37V3Z'
      fill='#F5F5F5'
    />
    <path
      d='M0 28H34V37C34 38.6569 32.6569 40 31 40H3C1.34315 40 0 38.6569 0 37V28Z'
      fill='#E71A01'
    />
    <path d='M34 11L26 11C24.3431 11 23 9.65685 23 8V0L34 11Z' fill='#DBDBDB' />
    <path
      clipRule='evenodd'
      d='M16.39 8.90641C16.215 8.27341 15.787 7.95841 15.426 8.00441C14.99 8.06141 14.526 8.32041 14.34 8.72941C13.854 9.82141 14.768 12.8934 15.028 13.7674L15.073 13.9194C14.015 17.1134 10.394 23.4264 8.62002 23.8534C8.58302 23.4364 8.80602 22.2294 11.146 20.7244C11.266 20.5944 11.406 20.4374 11.471 20.3344C9.49302 21.3004 6.93108 22.8514 8.47102 24.0114C8.55602 24.0774 8.68502 24.1314 8.83402 24.1874C10.014 24.6244 11.666 23.1954 13.327 19.9544C15.157 19.3504 16.633 18.8964 18.722 18.5804C21.005 20.1304 22.538 20.4464 23.578 20.0474C23.866 19.9354 24.32 19.5734 24.45 19.1004C24.515 18.8774 24.608 18.5154 24.432 18.2274C23.842 17.2664 21.452 17.5954 20.032 17.7904C19.779 17.8254 19.557 17.8564 19.381 17.8744C17.552 16.7704 16.289 14.8014 15.778 13.3804C15.857 13.0784 15.936 12.7894 16.012 12.5124C16.397 11.1124 16.701 10.0064 16.392 8.90641H16.39ZM24.45 19.1004C23.605 20.1404 21.628 19.4164 20.05 18.4224C21.507 18.2644 23.01 18.1724 23.661 18.3764C24.488 18.6364 24.459 19.0444 24.451 19.1004H24.45ZM15.601 12.7404C15.296 11.6544 14.868 9.24041 15.555 8.46041C16.701 9.11641 16.266 10.5384 15.825 11.9834C15.748 12.2364 15.671 12.4894 15.601 12.7404ZM13.439 19.5834C15.156 18.9054 16.354 18.4494 18.118 18.1254C16.818 16.9554 16.028 15.6834 15.378 14.3834C14.915 16.0554 13.948 18.5894 13.438 19.5834H13.439Z'
      fill='#E71A01'
      fillRule='evenodd'
    />
    <path
      d='M13.1719 33.0127V37.4219H12.1875V32.3018H13.1001L13.1719 33.0127ZM15.5132 34.1099V34.1816C15.5132 34.4505 15.4813 34.7 15.4175 34.9302C15.356 35.1603 15.2648 35.3608 15.144 35.5317C15.0233 35.7004 14.8729 35.8325 14.6929 35.9282C14.5151 36.0216 14.3101 36.0684 14.0776 36.0684C13.8521 36.0684 13.6561 36.0228 13.4897 35.9316C13.3234 35.8405 13.1833 35.7129 13.0693 35.5488C12.9577 35.3825 12.8677 35.1899 12.7993 34.9712C12.731 34.7524 12.6785 34.5177 12.6421 34.2671V34.0791C12.6785 33.8102 12.731 33.5641 12.7993 33.3408C12.8677 33.1152 12.9577 32.9204 13.0693 32.7563C13.1833 32.59 13.3223 32.4613 13.4863 32.3701C13.6527 32.279 13.8475 32.2334 14.0708 32.2334C14.3055 32.2334 14.5117 32.2778 14.6895 32.3667C14.8695 32.4556 15.0199 32.5832 15.1406 32.7495C15.2637 32.9159 15.356 33.1141 15.4175 33.3442C15.4813 33.5744 15.5132 33.8296 15.5132 34.1099ZM14.5254 34.1816V34.1099C14.5254 33.9526 14.5117 33.8079 14.4844 33.6758C14.4593 33.5413 14.4183 33.424 14.3613 33.3237C14.3066 33.2235 14.2337 33.146 14.1426 33.0913C14.0537 33.0343 13.9455 33.0059 13.8179 33.0059C13.6834 33.0059 13.5684 33.0275 13.4727 33.0708C13.3792 33.1141 13.3029 33.1768 13.2437 33.2588C13.1844 33.3408 13.14 33.4388 13.1104 33.5527C13.0807 33.6667 13.0625 33.7954 13.0557 33.939V34.4141C13.0671 34.5827 13.099 34.7342 13.1514 34.8687C13.2038 35.0008 13.2847 35.1056 13.394 35.1831C13.5034 35.2606 13.647 35.2993 13.8247 35.2993C13.9546 35.2993 14.064 35.2708 14.1528 35.2139C14.2417 35.1546 14.3135 35.0737 14.3682 34.9712C14.4251 34.8687 14.465 34.7502 14.4878 34.6157C14.5129 34.4813 14.5254 34.3366 14.5254 34.1816ZM18.3091 35.1934V30.75H19.3003V36H18.4082L18.3091 35.1934ZM15.9712 34.1953V34.1235C15.9712 33.841 16.0031 33.5846 16.0669 33.3545C16.1307 33.1221 16.2241 32.9227 16.3472 32.7563C16.4702 32.59 16.6217 32.4613 16.8018 32.3701C16.9818 32.279 17.1868 32.2334 17.417 32.2334C17.6335 32.2334 17.8226 32.279 17.9844 32.3701C18.1484 32.4613 18.2874 32.5911 18.4014 32.7598C18.5176 32.9261 18.611 33.1232 18.6816 33.3511C18.7523 33.5767 18.8035 33.8239 18.8354 34.0928V34.25C18.8035 34.5075 18.7523 34.7467 18.6816 34.9678C18.611 35.1888 18.5176 35.3825 18.4014 35.5488C18.2874 35.7129 18.1484 35.8405 17.9844 35.9316C17.8203 36.0228 17.6289 36.0684 17.4102 36.0684C17.18 36.0684 16.9749 36.0216 16.7949 35.9282C16.6172 35.8348 16.4668 35.7038 16.3438 35.5352C16.223 35.3665 16.1307 35.1683 16.0669 34.9404C16.0031 34.7126 15.9712 34.4642 15.9712 34.1953ZM16.9556 34.1235V34.1953C16.9556 34.348 16.967 34.4904 16.9897 34.6226C17.0148 34.7547 17.0547 34.8721 17.1094 34.9746C17.1663 35.0749 17.2393 35.1535 17.3281 35.2104C17.4193 35.2651 17.5298 35.2925 17.6597 35.2925C17.8283 35.2925 17.9673 35.2549 18.0767 35.1797C18.186 35.1022 18.2692 34.9963 18.3262 34.8618C18.3854 34.7274 18.4196 34.5724 18.4287 34.397V33.9492C18.4219 33.8057 18.4014 33.6769 18.3672 33.563C18.3353 33.4468 18.2874 33.3477 18.2236 33.2656C18.1621 33.1836 18.0846 33.1198 17.9912 33.0742C17.9001 33.0286 17.7918 33.0059 17.6665 33.0059C17.5389 33.0059 17.4295 33.0355 17.3384 33.0947C17.2472 33.1517 17.1732 33.2303 17.1162 33.3306C17.0615 33.4308 17.0205 33.5493 16.9932 33.686C16.9681 33.8205 16.9556 33.9663 16.9556 34.1235ZM21.3237 36H20.3325V31.9736C20.3325 31.6934 20.3872 31.4575 20.4966 31.2661C20.6082 31.0724 20.7643 30.9266 20.9648 30.8286C21.1676 30.7284 21.408 30.6782 21.686 30.6782C21.7772 30.6782 21.8649 30.6851 21.9492 30.6987C22.0335 30.7101 22.1156 30.7249 22.1953 30.7432L22.1851 31.4849C22.1418 31.4735 22.0962 31.4655 22.0483 31.4609C22.0005 31.4564 21.9447 31.4541 21.8809 31.4541C21.7624 31.4541 21.661 31.4746 21.5767 31.5156C21.4946 31.5544 21.432 31.6125 21.3887 31.6899C21.3454 31.7674 21.3237 31.862 21.3237 31.9736V36ZM22.062 32.3018V32.999H19.7822V32.3018H22.062Z'
      fill='white'
    />
  </svg>
);

export const FileWordIcon = ({
  className = '',
  size = DEFAULT_SIZE,
  ...props
}: IconProps) => (
  <svg
    className={clsx('rfu-file-word', className)}
    fill='none'
    height={size}
    viewBox='0 0 34 40'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M0 28H34V37C34 38.6569 32.6569 40 31 40H3C1.34315 40 0 38.6569 0 37V28Z'
      fill='#4285F4'
    />
    <path d='M0 3C0 1.34315 1.34315 0 3 0H23L34 11V28H0V3Z' fill='#F5F5F5' />
    <path d='M34 11L26 11C24.3431 11 23 9.65685 23 8V0L34 11Z' fill='#DBDBDB' />
    <path clipRule='evenodd' d='M8 13H23V15H8V13Z' fill='#4285F4' fillRule='evenodd' />
    <path clipRule='evenodd' d='M8 17H18V19H8V17Z' fill='#4285F4' fillRule='evenodd' />
    <path clipRule='evenodd' d='M8 21H23V23H8V21Z' fill='#4285F4' fillRule='evenodd' />
  </svg>
);

export const FileWordIconAlt = ({
  className = '',
  size = DEFAULT_SIZE,
  ...props
}: IconProps) => (
  <svg
    className={clsx('rfu-file-word-alt', className)}
    fill='none'
    height={size}
    viewBox='0 0 34 40'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M0 3C0 1.34315 1.34315 0 3 0H23L34 11V37C34 38.6569 32.6569 40 31 40H3C1.34315 40 0 38.6569 0 37V3Z'
      fill='url(#paint0_linear_11084_64)'
    />
    <path d='M34 11L26 11C24.3431 11 23 9.65685 23 8V0L34 11Z' fill='#3670D3' />
    <path clipRule='evenodd' d='M8 13H23V15H8V13Z' fill='#C1D8FF' fillRule='evenodd' />
    <path clipRule='evenodd' d='M8 17H18V19H8V17Z' fill='#C1D8FF' fillRule='evenodd' />
    <path clipRule='evenodd' d='M8 21H23V23H8V21Z' fill='#C1D8FF' fillRule='evenodd' />
    <defs>
      <linearGradient
        gradientUnits='userSpaceOnUse'
        id='paint0_linear_11084_64'
        x1='0'
        x2='0'
        y1='0'
        y2='40'
      >
        <stop stopColor='#79A4F2' />
        <stop offset='1' stopColor='#3375E2' />
      </linearGradient>
    </defs>
  </svg>
);

export const FilePowerPointIcon = ({
  className = '',
  size = DEFAULT_SIZE,
  ...props
}: IconProps) => (
  <svg
    className={clsx('rfu-file-powerpoint', className)}
    fill='none'
    height={size}
    viewBox='0 0 34 40'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      clipRule='evenodd'
      d='M17.7168 33.172C18.2348 33.172 18.4238 33.655 18.4238 34.18C18.4238 34.642 18.2978 35.195 17.7168 35.195C17.1708 35.195 16.9888 34.642 16.9888 34.145C16.9888 33.683 17.1708 33.172 17.7168 33.172ZM19.5718 31.002H18.3818V32.7589H18.3678C18.1228 32.43 17.7798 32.262 17.3318 32.262C16.3028 32.262 15.7988 33.158 15.7988 34.103C15.7988 35.125 16.2818 36.1049 17.4228 36.1049C17.8428 36.1049 18.1928 35.923 18.4238 35.58H18.4378V36H19.5718V31.002ZM12.7095 34.1872C12.7095 33.7252 12.8775 33.1722 13.4305 33.1722C13.9835 33.1722 14.1585 33.7252 14.1585 34.1872C14.1585 34.6492 13.9835 35.1952 13.4305 35.1952C12.8775 35.1952 12.7095 34.6492 12.7095 34.1872ZM11.5195 34.1872C11.5195 35.2792 12.3035 36.1052 13.4305 36.1052C14.5575 36.1052 15.3485 35.2792 15.3485 34.1872C15.3485 33.0952 14.5575 32.2622 13.4305 32.2622C12.3035 32.2622 11.5195 33.0952 11.5195 34.1872ZM21.839 32.3671H22.574V33.1371H21.839V34.7891C21.839 35.0761 22.007 35.1391 22.266 35.1391C22.3142 35.1391 22.364 35.1357 22.4147 35.1323C22.4672 35.1287 22.5206 35.1251 22.574 35.1251V36.0001C22.481 36.0031 22.388 36.0099 22.295 36.0168C22.171 36.0259 22.047 36.0351 21.923 36.0351C20.908 36.0351 20.649 35.7411 20.649 34.7541V33.1371H20.047V32.3671H20.649V31.2681H21.839V32.3671Z'
      fill='white'
      fillRule='evenodd'
    />
    <path
      d='M0 28H34V37C34 38.6569 32.6569 40 31 40H3C1.34315 40 0 38.6569 0 37V28Z'
      fill='#D65537'
    />
    <path d='M0 3C0 1.34315 1.34315 0 3 0H23L34 11V28H0V3Z' fill='#F5F5F5' />
    <path d='M34 11L26 11C24.3431 11 23 9.65685 23 8V0L34 11Z' fill='#DBDBDB' />
    <path
      clipRule='evenodd'
      d='M7 12C7 10.8954 7.89543 10 9 10H19C20.1046 10 21 10.8954 21 12V18C21 19.1046 20.1046 20 19 20H9C7.89543 20 7 19.1046 7 18V12ZM9 12H19V18H9V12ZM25 22C25 23.1046 24.1046 24 23 24H11V22H23V15H25V22Z'
      fill='#D65537'
      fillRule='evenodd'
    />
  </svg>
);

export const FilePowerPointIconAlt = ({
  className = '',
  size = DEFAULT_SIZE,
  ...props
}: IconProps) => (
  <svg
    className={clsx('rfu-file-powerpoint-alt', className)}
    fill='none'
    height={size}
    viewBox='0 0 34 40'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M0 3C0 1.34315 1.34315 0 3 0H23L34 11V37C34 38.6569 32.6569 40 31 40H3C1.34315 40 0 38.6569 0 37V3Z'
      fill='url(#paint0_linear_11084_76)'
    />
    <path d='M34 11L26 11C24.3431 11 23 9.65685 23 8V0L34 11Z' fill='#AB381D' />
    <path
      clipRule='evenodd'
      d='M7 12C7 10.8954 7.89543 10 9 10H19C20.1046 10 21 10.8954 21 12V18C21 19.1046 20.1046 20 19 20H9C7.89543 20 7 19.1046 7 18V12ZM9 12H19V18H9V12ZM25 22C25 23.1046 24.1046 24 23 24H11V22H23V15H25V22Z'
      fill='#FFB3A0'
      fillRule='evenodd'
    />
    <defs>
      <linearGradient
        gradientUnits='userSpaceOnUse'
        id='paint0_linear_11084_76'
        x1='0'
        x2='0'
        y1='0'
        y2='40'
      >
        <stop stopColor='#DC7259' />
        <stop offset='1' stopColor='#D14423' />
      </linearGradient>
    </defs>
  </svg>
);

export const FileExcelIcon = ({
  className = '',
  size = DEFAULT_SIZE,
  ...props
}: IconProps) => (
  <svg
    className={clsx('rfu-file-excel', className)}
    fill='none'
    height={size}
    viewBox='0 0 34 40'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      clipRule='evenodd'
      d='M17.7168 33.172C18.2348 33.172 18.4238 33.655 18.4238 34.18C18.4238 34.642 18.2978 35.195 17.7168 35.195C17.1708 35.195 16.9888 34.642 16.9888 34.145C16.9888 33.683 17.1708 33.172 17.7168 33.172ZM19.5718 31.002H18.3818V32.7589H18.3678C18.1228 32.43 17.7798 32.262 17.3318 32.262C16.3028 32.262 15.7988 33.158 15.7988 34.103C15.7988 35.125 16.2818 36.1049 17.4228 36.1049C17.8428 36.1049 18.1928 35.923 18.4238 35.58H18.4378V36H19.5718V31.002ZM12.7095 34.1872C12.7095 33.7252 12.8775 33.1722 13.4305 33.1722C13.9835 33.1722 14.1585 33.7252 14.1585 34.1872C14.1585 34.6492 13.9835 35.1952 13.4305 35.1952C12.8775 35.1952 12.7095 34.6492 12.7095 34.1872ZM11.5195 34.1872C11.5195 35.2792 12.3035 36.1052 13.4305 36.1052C14.5575 36.1052 15.3485 35.2792 15.3485 34.1872C15.3485 33.0952 14.5575 32.2622 13.4305 32.2622C12.3035 32.2622 11.5195 33.0952 11.5195 34.1872ZM21.839 32.3671H22.574V33.1371H21.839V34.7891C21.839 35.0761 22.007 35.1391 22.266 35.1391C22.3142 35.1391 22.364 35.1357 22.4147 35.1323C22.4672 35.1287 22.5206 35.1251 22.574 35.1251V36.0001C22.481 36.0031 22.388 36.0099 22.295 36.0168C22.171 36.0259 22.047 36.0351 21.923 36.0351C20.908 36.0351 20.649 35.7411 20.649 34.7541V33.1371H20.047V32.3671H20.649V31.2681H21.839V32.3671Z'
      fill='white'
      fillRule='evenodd'
    />
    <path
      d='M0 28H34V37C34 38.6569 32.6569 40 31 40H3C1.34315 40 0 38.6569 0 37V28Z'
      fill='#0F9D58'
    />
    <path d='M0 3C0 1.34315 1.34315 0 3 0H23L34 11V28H0V3Z' fill='#F5F5F5' />
    <path d='M34 11L26 11C24.3431 11 23 9.65685 23 8V0L34 11Z' fill='#DBDBDB' />
    <path
      clipRule='evenodd'
      d='M12 13H7V15H12V13ZM12 17H7V19H12V17ZM7 21H12V23H7V21ZM23 13H14V15H23V13ZM14 17H23V19H14V17ZM23 21H14V23H23V21Z'
      fill='#0F9D58'
      fillRule='evenodd'
    />
  </svg>
);

export const FileExcelIconAlt = ({
  className = '',
  size = DEFAULT_SIZE,
  ...props
}: IconProps) => (
  <svg
    className={clsx('rfu-file-excel-alt', className)}
    fill='none'
    height={size}
    viewBox='0 0 34 40'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M0 3C0 1.34315 1.34315 0 3 0H23L34 11V37C34 38.6569 32.6569 40 31 40H3C1.34315 40 0 38.6569 0 37V3Z'
      fill='url(#paint0_linear_11084_326)'
    />
    <path d='M34 11L26 11C24.3431 11 23 9.65685 23 8V0L34 11Z' fill='#0C864B' />
    <path
      clipRule='evenodd'
      d='M12 13H7V15H12V13ZM12 17H7V19H12V17ZM7 21H12V23H7V21ZM23 13H14V15H23V13ZM14 17H23V19H14V17ZM23 21H14V23H23V21Z'
      fill='#A8E7C9'
      fillRule='evenodd'
    />
    <defs>
      <linearGradient
        gradientUnits='userSpaceOnUse'
        id='paint0_linear_11084_326'
        x1='0'
        x2='0'
        y1='0'
        y2='40'
      >
        <stop stopColor='#64AD8A' />
        <stop offset='1' stopColor='#0C864B' />
      </linearGradient>
    </defs>
  </svg>
);

export const FileArchiveIcon = ({
  className = '',
  size = DEFAULT_SIZE,
  ...props
}: IconProps) => (
  <svg
    className={clsx('rfu-file-archive', className)}
    fill='none'
    height={size}
    viewBox='0 0 34 40'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      clipRule='evenodd'
      d='M17.7168 33.172C18.2348 33.172 18.4238 33.655 18.4238 34.18C18.4238 34.642 18.2978 35.195 17.7168 35.195C17.1708 35.195 16.9888 34.642 16.9888 34.145C16.9888 33.683 17.1708 33.172 17.7168 33.172ZM19.5718 31.002H18.3818V32.7589H18.3678C18.1228 32.43 17.7798 32.262 17.3318 32.262C16.3028 32.262 15.7988 33.158 15.7988 34.103C15.7988 35.125 16.2818 36.1049 17.4228 36.1049C17.8428 36.1049 18.1928 35.923 18.4238 35.58H18.4378V36H19.5718V31.002ZM12.7095 34.1872C12.7095 33.7252 12.8775 33.1722 13.4305 33.1722C13.9835 33.1722 14.1585 33.7252 14.1585 34.1872C14.1585 34.6492 13.9835 35.1952 13.4305 35.1952C12.8775 35.1952 12.7095 34.6492 12.7095 34.1872ZM11.5195 34.1872C11.5195 35.2792 12.3035 36.1052 13.4305 36.1052C14.5575 36.1052 15.3485 35.2792 15.3485 34.1872C15.3485 33.0952 14.5575 32.2622 13.4305 32.2622C12.3035 32.2622 11.5195 33.0952 11.5195 34.1872ZM21.839 32.3671H22.574V33.1371H21.839V34.7891C21.839 35.0761 22.007 35.1391 22.266 35.1391C22.3142 35.1391 22.364 35.1357 22.4147 35.1323C22.4672 35.1287 22.5206 35.1251 22.574 35.1251V36.0001C22.481 36.0031 22.388 36.0099 22.295 36.0168C22.171 36.0259 22.047 36.0351 21.923 36.0351C20.908 36.0351 20.649 35.7411 20.649 34.7541V33.1371H20.047V32.3671H20.649V31.2681H21.839V32.3671Z'
      fill='white'
      fillRule='evenodd'
    />
    <path
      d='M0 28H34V37C34 38.6569 32.6569 40 31 40H3C1.34315 40 0 38.6569 0 37V28Z'
      fill='#F8B859'
    />
    <path d='M0 3C0 1.34315 1.34315 0 3 0H23L34 11V28H0V3Z' fill='#F5F5F5' />
    <path d='M34 11L26 11C24.3431 11 23 9.65685 23 8V0L34 11Z' fill='#DBDBDB' />
    <path
      clipRule='evenodd'
      d='M10 0H8V2H10V4H8V6H10V8H8V10H10V12H8V14H10V12H12V10H10V8H12V6H10V4H12V2H10V0ZM8 17C8 16.4477 8.44771 16 9 16H11C11.5523 16 12 16.4477 12 17V23C12 23.5523 11.5523 24 11 24H9C8.44771 24 8 23.5523 8 23V17ZM9 23V20H11V23H9Z'
      fill='#F8B859'
      fillRule='evenodd'
    />
  </svg>
);

export const FileArchiveIconAlt = ({
  className = '',
  size = DEFAULT_SIZE,
  ...props
}: IconProps) => (
  <svg
    className={clsx('rfu-file-archive-alt', className)}
    fill='none'
    height={size}
    viewBox='0 0 34 40'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M0 3C0 1.34315 1.34315 0 3 0H23L34 11V37C34 38.6569 32.6569 40 31 40H3C1.34315 40 0 38.6569 0 37V3Z'
      fill='url(#paint0_linear_11086_246)'
    />
    <path d='M34 11L26 11C24.3431 11 23 9.65685 23 8V0L34 11Z' fill='#B67A24' />
    <path
      clipRule='evenodd'
      d='M10 0H8V2H10V4H8V6H10V8H8V10H10V12H8V14H10V12H12V10H10V8H12V6H10V4H12V2H10V0ZM8 17C8 16.4477 8.44771 16 9 16H11C11.5523 16 12 16.4477 12 17V23C12 23.5523 11.5523 24 11 24H9C8.44771 24 8 23.5523 8 23V17ZM9 23V20H11V23H9Z'
      fill='#FFE9C8'
      fillRule='evenodd'
    />
    <defs>
      <linearGradient
        gradientUnits='userSpaceOnUse'
        id='paint0_linear_11086_246'
        x1='0'
        x2='0'
        y1='0'
        y2='40'
      >
        <stop stopColor='#FFC775' />
        <stop offset='1' stopColor='#E69E34' />
      </linearGradient>
    </defs>
  </svg>
);

export const FileCodeIcon = ({
  className = '',
  size = DEFAULT_SIZE,
  ...props
}: IconProps) => (
  <svg
    className={clsx('rfu-file-code', className)}
    fill='none'
    height={size}
    viewBox='0 0 34 40'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M0 28H34V37C34 38.6569 32.6569 40 31 40H3C1.34315 40 0 38.6569 0 37V28Z'
      fill='#00ACA1'
    />
    <path d='M0 3C0 1.34315 1.34315 0 3 0H23L34 11V28H0V3Z' fill='#F5F5F5' />
    <path d='M34 11L26 11C24.3431 11 23 9.65685 23 8V0L34 11Z' fill='#DBDBDB' />
    <path
      clipRule='evenodd'
      d='M15 21V18.984L11.5 18L15 17V15L9 17V19L15 21ZM19 15V17.016L22.5 18L19 19V21L25 19V17L19 15Z'
      fill='#00ACA1'
      fillRule='evenodd'
    />
  </svg>
);

export const FileCodeIconAlt = ({
  className = '',
  size = DEFAULT_SIZE,
  ...props
}: IconProps) => (
  <svg
    className={clsx('rfu-file-code-alt', className)}
    fill='none'
    height={size}
    viewBox='0 0 34 40'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M0 3C0 1.34315 1.34315 0 3 0H23L34 11V37C34 38.6569 32.6569 40 31 40H3C1.34315 40 0 38.6569 0 37V3Z'
      fill='url(#paint0_linear_11086_611)'
    />
    <path d='M34 11L26 11C24.3431 11 23 9.65685 23 8V0L34 11Z' fill='#00ACA1' />
    <path
      clipRule='evenodd'
      d='M15 21V18.984L11.5 18L15 17V15L9 17V19L15 21ZM19 15V17.016L22.5 18L19 19V21L25 19V17L19 15Z'
      fill='#A3DCD8'
      fillRule='evenodd'
    />
    <defs>
      <linearGradient
        gradientUnits='userSpaceOnUse'
        id='paint0_linear_11086_611'
        x1='0'
        x2='0'
        y1='0'
        y2='40'
      >
        <stop stopColor='#7FC4BD' />
        <stop offset='1' stopColor='#00ACA1' />
      </linearGradient>
    </defs>
  </svg>
);

export const FileAudioIcon = ({
  className = '',
  size = DEFAULT_SIZE,
  ...props
}: IconProps) => (
  <svg
    className={clsx('rfu-file-audio', className)}
    fill='none'
    height={size}
    viewBox='0 0 34 40'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      clipRule='evenodd'
      d='M17.7168 33.172C18.2348 33.172 18.4238 33.655 18.4238 34.18C18.4238 34.642 18.2978 35.195 17.7168 35.195C17.1708 35.195 16.9888 34.642 16.9888 34.145C16.9888 33.683 17.1708 33.172 17.7168 33.172ZM19.5718 31.002H18.3818V32.7589H18.3678C18.1228 32.43 17.7798 32.262 17.3318 32.262C16.3028 32.262 15.7988 33.158 15.7988 34.103C15.7988 35.125 16.2818 36.1049 17.4228 36.1049C17.8428 36.1049 18.1928 35.923 18.4238 35.58H18.4378V36H19.5718V31.002ZM12.7095 34.1872C12.7095 33.7252 12.8775 33.1722 13.4305 33.1722C13.9835 33.1722 14.1585 33.7252 14.1585 34.1872C14.1585 34.6492 13.9835 35.1952 13.4305 35.1952C12.8775 35.1952 12.7095 34.6492 12.7095 34.1872ZM11.5195 34.1872C11.5195 35.2792 12.3035 36.1052 13.4305 36.1052C14.5575 36.1052 15.3485 35.2792 15.3485 34.1872C15.3485 33.0952 14.5575 32.2622 13.4305 32.2622C12.3035 32.2622 11.5195 33.0952 11.5195 34.1872ZM21.839 32.3671H22.574V33.1371H21.839V34.7891C21.839 35.0761 22.007 35.1391 22.266 35.1391C22.3142 35.1391 22.364 35.1357 22.4147 35.1323C22.4672 35.1287 22.5206 35.1251 22.574 35.1251V36.0001C22.481 36.0031 22.388 36.0099 22.295 36.0168C22.171 36.0259 22.047 36.0351 21.923 36.0351C20.908 36.0351 20.649 35.7411 20.649 34.7541V33.1371H20.047V32.3671H20.649V31.2681H21.839V32.3671Z'
      fill='white'
      fillRule='evenodd'
    />
    <path
      d='M0 28H34V37C34 38.6569 32.6569 40 31 40H3C1.34315 40 0 38.6569 0 37V28Z'
      fill='#2727B0'
    />
    <path d='M0 3C0 1.34315 1.34315 0 3 0H23L34 11V28H0V3Z' fill='#F5F5F5' />
    <path d='M34 11L26 11C24.3431 11 23 9.65685 23 8V0L34 11Z' fill='#DBDBDB' />
    <path
      clipRule='evenodd'
      d='M8.87912 21.941H12.298L16.9521 24.7493C17.0307 24.8138 17.1293 24.849 17.2311 24.849C17.4738 24.8488 17.6705 24.6519 17.6703 24.4092V12.4399C17.6704 12.3381 17.6352 12.2396 17.5707 12.1609C17.4168 11.9732 17.1398 11.9457 16.9521 12.0996L12.298 14.908H8.87912C8.3936 14.908 8 15.3016 8 15.7871V21.0619C8 21.5474 8.3936 21.941 8.87912 21.941ZM12.9258 16.6664L15.9122 15.2224V21.6268L12.9258 20.1829H9.7583V16.6664H12.9258ZM19.8511 16.3517C19.474 16.4092 19.2397 16.6637 19.3283 16.9191L19.3262 16.92C19.5295 17.4995 19.6305 18.098 19.6284 18.6953C19.6305 19.2975 19.5237 19.9014 19.3196 20.4909C19.229 20.7462 19.4682 20.9996 19.8474 21.06C19.9008 21.0683 19.9542 21.072 20.0076 21.072C20.3259 21.072 20.6156 20.9234 20.6922 20.7057C20.9194 20.0451 21.0337 19.37 21.0374 18.6953C21.0349 18.0251 20.9211 17.3575 20.6955 16.7035C20.6053 16.4477 20.229 16.2908 19.8511 16.3517ZM22.1605 14.6028C22.5252 14.5163 22.9259 14.6454 23.055 14.8938C23.6891 16.1157 24 17.4042 24 18.6923C24.0004 19.9895 23.6796 21.2839 23.0521 22.5153C22.9503 22.7123 22.6763 22.8344 22.3828 22.8344C22.3071 22.8344 22.2301 22.8261 22.1543 22.8092C21.7863 22.7251 21.5914 22.4536 21.7185 22.2077C22.2988 21.0761 22.5922 19.8836 22.5931 18.6919C22.5931 17.5056 22.3054 16.3222 21.7276 15.2025C21.6001 14.9563 21.795 14.686 22.1605 14.6028Z'
      fill='#2727B0'
      fillRule='evenodd'
    />
  </svg>
);

export const FileAudioIconAlt = ({
  className = '',
  size = DEFAULT_SIZE,
  ...props
}: IconProps) => (
  <svg
    className={clsx('rfu-file-audio-alt', className)}
    fill='none'
    height={size}
    viewBox='0 0 34 40'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M0 3C0 1.34315 1.34315 0 3 0H23L34 11V37C34 38.6569 32.6569 40 31 40H3C1.34315 40 0 38.6569 0 37V3Z'
      fill='url(#paint0_linear_11086_420)'
    />
    <path d='M34 11L26 11C24.3431 11 23 9.65685 23 8V0L34 11Z' fill='#1919A5' />
    <path
      clipRule='evenodd'
      d='M8.87912 21.941H12.298L16.9521 24.7493C17.0307 24.8138 17.1293 24.849 17.2311 24.849C17.4738 24.8488 17.6705 24.6519 17.6703 24.4092V12.4399C17.6704 12.3381 17.6352 12.2396 17.5707 12.1609C17.4168 11.9732 17.1398 11.9457 16.9521 12.0996L12.298 14.908H8.87912C8.3936 14.908 8 15.3016 8 15.7871V21.0619C8 21.5474 8.3936 21.941 8.87912 21.941ZM12.9258 16.6664L15.9122 15.2224V21.6268L12.9258 20.1829H9.7583V16.6664H12.9258ZM19.8511 16.3517C19.474 16.4092 19.2397 16.6637 19.3283 16.9191L19.3262 16.92C19.5295 17.4995 19.6305 18.098 19.6284 18.6953C19.6305 19.2975 19.5237 19.9014 19.3196 20.4909C19.229 20.7462 19.4682 20.9996 19.8474 21.06C19.9008 21.0683 19.9542 21.072 20.0076 21.072C20.3259 21.072 20.6156 20.9234 20.6922 20.7057C20.9194 20.0451 21.0337 19.37 21.0374 18.6953C21.0349 18.0251 20.9211 17.3575 20.6955 16.7035C20.6053 16.4477 20.229 16.2908 19.8511 16.3517ZM22.1605 14.6028C22.5252 14.5163 22.9259 14.6454 23.055 14.8938C23.6891 16.1157 24 17.4042 24 18.6923C24.0004 19.9895 23.6796 21.2839 23.0521 22.5153C22.9503 22.7123 22.6763 22.8344 22.3828 22.8344C22.3071 22.8344 22.2301 22.8261 22.1543 22.8092C21.7863 22.7251 21.5914 22.4536 21.7185 22.2077C22.2988 21.0761 22.5922 19.8836 22.5931 18.6919C22.5931 17.5056 22.3054 16.3222 21.7276 15.2025C21.6001 14.9563 21.795 14.686 22.1605 14.6028Z'
      fill='#AAAAFF'
      fillRule='evenodd'
    />
    <defs>
      <linearGradient
        gradientUnits='userSpaceOnUse'
        id='paint0_linear_11086_420'
        x1='0'
        x2='0'
        y1='0'
        y2='40'
      >
        <stop stopColor='#4A4AB8' />
        <stop offset='1' stopColor='#2727B0' />
      </linearGradient>
    </defs>
  </svg>
);

export const FileVideoIcon = ({
  className = '',
  size = DEFAULT_SIZE,
  ...props
}: IconProps) => (
  <svg
    className={clsx('rfu-file-video', className)}
    fill='none'
    height={size}
    viewBox='0 0 34 40'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      clipRule='evenodd'
      d='M17.7168 33.172C18.2348 33.172 18.4238 33.655 18.4238 34.18C18.4238 34.642 18.2978 35.195 17.7168 35.195C17.1708 35.195 16.9888 34.642 16.9888 34.145C16.9888 33.683 17.1708 33.172 17.7168 33.172ZM19.5718 31.002H18.3818V32.7589H18.3678C18.1228 32.43 17.7798 32.262 17.3318 32.262C16.3028 32.262 15.7988 33.158 15.7988 34.103C15.7988 35.125 16.2818 36.1049 17.4228 36.1049C17.8428 36.1049 18.1928 35.923 18.4238 35.58H18.4378V36H19.5718V31.002ZM12.7095 34.1872C12.7095 33.7252 12.8775 33.1722 13.4305 33.1722C13.9835 33.1722 14.1585 33.7252 14.1585 34.1872C14.1585 34.6492 13.9835 35.1952 13.4305 35.1952C12.8775 35.1952 12.7095 34.6492 12.7095 34.1872ZM11.5195 34.1872C11.5195 35.2792 12.3035 36.1052 13.4305 36.1052C14.5575 36.1052 15.3485 35.2792 15.3485 34.1872C15.3485 33.0952 14.5575 32.2622 13.4305 32.2622C12.3035 32.2622 11.5195 33.0952 11.5195 34.1872ZM21.839 32.3671H22.574V33.1371H21.839V34.7891C21.839 35.0761 22.007 35.1391 22.266 35.1391C22.3142 35.1391 22.364 35.1357 22.4147 35.1323C22.4672 35.1287 22.5206 35.1251 22.574 35.1251V36.0001C22.481 36.0031 22.388 36.0099 22.295 36.0168C22.171 36.0259 22.047 36.0351 21.923 36.0351C20.908 36.0351 20.649 35.7411 20.649 34.7541V33.1371H20.047V32.3671H20.649V31.2681H21.839V32.3671Z'
      fill='white'
      fillRule='evenodd'
    />
    <path
      d='M0 28H34V37C34 38.6569 32.6569 40 31 40H3C1.34315 40 0 38.6569 0 37V28Z'
      fill='#9D27B0'
    />
    <path d='M0 3C0 1.34315 1.34315 0 3 0H23L34 11V28H0V3Z' fill='#F5F5F5' />
    <path d='M34 11L26 11C24.3431 11 23 9.65685 23 8V0L34 11Z' fill='#DBDBDB' />
    <path
      d='M9 17H25V24H9V17ZM27 14C27 12.8954 26.1046 12 25 12H22L24 15H21L19 12H17L19 15H16L14 12H12L14 15H11L9 12C7.9 12 7.01 12.9 7.01 14L7 24C7 25.1 7.9 26 9 26H25C26.1 26 27 25.1 27 24V14Z'
      fill='#9D27B0'
    />
  </svg>
);

export const FileVideoIconAlt = ({
  className = '',
  size = DEFAULT_SIZE,
  ...props
}: IconProps) => (
  <svg
    className={clsx('rfu-file-video-alt', className)}
    fill='none'
    height={size}
    viewBox='0 0 34 40'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M0 3C0 1.34315 1.34315 0 3 0H23L34 11V37C34 38.6569 32.6569 40 31 40H3C1.34315 40 0 38.6569 0 37V3Z'
      fill='url(#paint0_linear_18604_164254)'
    />
    <path d='M34 11L26 11C24.3431 11 23 9.65685 23 8V0L34 11Z' fill='#7A1589' />
    <path
      d='M9 17H25V24H9V17ZM27 14C27 12.8954 26.1046 12 25 12H22L24 15H21L19 12H17L19 15H16L14 12H12L14 15H11L9 12C7.9 12 7.01 12.9 7.01 14L7 24C7 25.1 7.9 26 9 26H25C26.1 26 27 25.1 27 24V14Z'
      fill='#F3A8FF'
    />
    <defs>
      <linearGradient
        gradientUnits='userSpaceOnUse'
        id='paint0_linear_18604_164254'
        x1='0'
        x2='0'
        y1='0'
        y2='40'
      >
        <stop stopColor='#A94AB8' />
        <stop offset='1' stopColor='#9D27B0' />
      </linearGradient>
    </defs>
  </svg>
);

export const FileFallbackIcon = ({
  className = '',
  size = DEFAULT_SIZE,
  ...props
}: IconProps) => (
  <svg
    className={clsx('rfu-file-fallback ', className)}
    fill='none'
    height={size}
    viewBox='0 0 34 40'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M0 3C0 1.34315 1.34315 0 3 0H23L34 11V37C34 38.6569 32.6569 40 31 40H3C1.34315 40 0 38.6569 0 37V3Z'
      fill='url(#paint0_linear)'
    />
    <path d='M34 11L26 11C24.3431 11 23 9.65685 23 8V0L34 11Z' fill='#DBDBDB' />
    <path clipRule='evenodd' d='M8 13H23V15H8V13Z' fill='#CFCFCF' fillRule='evenodd' />
    <path clipRule='evenodd' d='M8 17H18V19H8V17Z' fill='#CFCFCF' fillRule='evenodd' />
    <path clipRule='evenodd' d='M8 21H23V23H8V21Z' fill='#CFCFCF' fillRule='evenodd' />
    <defs>
      <linearGradient
        gradientUnits='userSpaceOnUse'
        id='paint0_linear'
        x1='0'
        x2='0'
        y1='0'
        y2='40'
      >
        <stop stopColor='white' />
        <stop offset='1' stopColor='#DBDBDB' />
      </linearGradient>
    </defs>
  </svg>
);

// v1 icon without possibility to specify size via props
export const FileImageIcon = ({
  className = '',
  size = DEFAULT_SIZE,
  ...props
}: IconProps) => (
  <svg
    className={clsx('rfu-file-image', className)}
    height={size}
    viewBox='0 0 384 512'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M369.9 97.9L286 14C277 5 264.8-.1 252.1-.1H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V131.9c0-12.7-5.1-25-14.1-34zM332.1 128H256V51.9l76.1 76.1zM48 464V48h160v104c0 13.3 10.7 24 24 24h104v288H48zm32-48h224V288l-23.5-23.5c-4.7-4.7-12.3-4.7-17 0L176 352l-39.5-39.5c-4.7-4.7-12.3-4.7-17 0L80 352v64zm48-240c-26.5 0-48 21.5-48 48s21.5 48 48 48 48-21.5 48-48-21.5-48-48-48z'
      fill='#414D54'
    />
  </svg>
);
