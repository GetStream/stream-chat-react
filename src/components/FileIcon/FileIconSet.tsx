import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import React from 'react';
import clsx from 'clsx';

export const BASE_FILE_ICON_CLASSNAME = 'str-chat__file-icon' as const;
export const FILE_ICON_GRAPHIC_CLASSNAME = 'str-chat__file-icon__graphic' as const;
/** Add this class (e.g. via className) when hiding the label with CSS to center the icon graphic. */
export const FILE_ICON_NO_LABEL_CLASSNAME = 'str-chat__file-icon--no-label' as const;

export type FileIconSize = 'sm' | 'md' | 'lg' | 'xl';

export type FileIconSizeConfigEntry = {
  width: number;
  height: number;
  labelX: number;
  labelY: number;
};

/** Rendered dimensions (px) and label position in viewBox coords for consistent spacing. */
export const FILE_ICON_SIZE_CONFIG: Record<FileIconSize, FileIconSizeConfigEntry> = {
  lg: { height: 40, labelX: 16, labelY: 36, width: 32 },
  md: { height: 32, labelX: 16, labelY: 35, width: 26 },
  sm: { height: 24, labelX: 16, labelY: 31.5, width: 19 },
  xl: { height: 48, labelX: 16, labelY: 36, width: 40 },
};

/** Merge partial overrides with default config. Use for Chat-level fileIconSizeConfig. */
export const mergeFileIconSizeConfig = (
  overrides?: Partial<Record<FileIconSize, Partial<FileIconSizeConfigEntry>>>,
): Record<FileIconSize, FileIconSizeConfigEntry> => {
  if (!overrides) return FILE_ICON_SIZE_CONFIG;
  return (['sm', 'md', 'lg', 'xl'] as const).reduce(
    (acc, size) => ({
      ...acc,
      [size]: { ...FILE_ICON_SIZE_CONFIG[size], ...overrides[size] },
    }),
    {} as Record<FileIconSize, FileIconSizeConfigEntry>,
  );
};

const FILE_ICON_VIEWBOX = { height: 40, width: 32 } as const;
const FILE_ICON_PAPER_PATH =
  'M0 4C0 1.79086 1.79086 0 4 0H22.4L32 10V36C32 38.2091 30.2091 40 28 40H4C1.79086 40 0 38.2091 0 36V4Z';
const FILE_ICON_FOLD_PATH = 'M32 10H25.4C23.7431 10 22.4 8.65685 22.4 7V0L32 10Z';
const FILE_ICON_WITHOUT_CAPTION_SYMBOL_SCALE_X = 32 / 26;
const FILE_ICON_WITHOUT_CAPTION_SYMBOL_SCALE_Y = 40 / 32;

export type BaseFileIconProps = {
  label?: string;
  /** Resolved size config (defaults from FILE_ICON_SIZE_CONFIG when omitted). Pass sizeConfig on FileIcon or use AttachmentFileIcon to override. */
  sizeConfig?: Record<FileIconSize, FileIconSizeConfigEntry>;
  size?: FileIconSize;
} & ComponentPropsWithoutRef<'svg'>;

type SvgProps = Omit<BaseFileIconProps, 'label'>;

const Svg = ({ className, size, sizeConfig, ...props }: SvgProps) => {
  const config = sizeConfig ?? FILE_ICON_SIZE_CONFIG;
  const dimensions = size ? config[size] : undefined;
  const dimensionsStyle = dimensions
    ? {
        flexShrink: 0,
        height: `${dimensions.height}px`,
        width: `${dimensions.width}px`,
      }
    : undefined;

  return (
    <svg
      height={dimensions?.height}
      viewBox={`0 0 ${FILE_ICON_VIEWBOX.width} ${FILE_ICON_VIEWBOX.height}`}
      width={dimensions?.width}
      xmlns='http://www.w3.org/2000/svg'
      {...props}
      className={clsx(
        BASE_FILE_ICON_CLASSNAME,
        { [`${BASE_FILE_ICON_CLASSNAME}--size-${size}`]: size },
        className,
      )}
      style={{ ...dimensionsStyle, ...props.style }}
    />
  );
};

type FileIconLabelProps = {
  label?: string;
  size?: FileIconSize;
  sizeConfig?: Record<FileIconSize, FileIconSizeConfigEntry>;
};

const FileIconLabel = ({ label, size, sizeConfig }: FileIconLabelProps) => {
  const configMap = sizeConfig ?? FILE_ICON_SIZE_CONFIG;
  const config = size ? configMap[size] : { labelX: 16, labelY: 33 };
  return (
    <text className='str-chat__file-icon__label' x={config.labelX} y={config.labelY}>
      {label}
    </text>
  );
};

type FileIconSymbolMap = {
  withCaption: ReactNode;
  withoutCaption: ReactNode;
};

const TEXT_SYMBOLS: FileIconSymbolMap = {
  withCaption: (
    <>
      <rect fill='white' height='1.6' rx='0.8' width='14.4' x='8' y='12.2' />
      <rect fill='white' height='1.6' rx='0.8' width='14.4' x='8' y='20.2' />
      <rect fill='white' height='1.6' rx='0.8' width='9.6' x='8' y='16.2' />
    </>
  ),
  withoutCaption: (
    <>
      <rect fill='white' height='1.4' rx='0.7' width='12.6' x='6' y='14.8' />
      <rect fill='white' height='1.4' rx='0.7' width='12.6' x='6' y='21.8' />
      <rect fill='white' height='1.4' rx='0.7' width='8.4' x='6' y='18.3' />
    </>
  ),
};

const OTHER_SYMBOLS: FileIconSymbolMap = {
  withCaption: (
    <>
      <rect fill='white' height='1.6' rx='0.8' width='14.4' x='8' y='13.2' />
      <rect fill='white' height='1.6' rx='0.8' width='14.4' x='8' y='21.2' />
      <rect fill='white' height='1.6' rx='0.8' width='9.6' x='8' y='17.2' />
    </>
  ),
  withoutCaption: TEXT_SYMBOLS.withoutCaption,
};

const CODE_SYMBOLS: FileIconSymbolMap = {
  withCaption: (
    <path
      d='M14.5 22.5L17.5 11.5M20.1666 14.1667L21.9732 16.0862C22.4564 16.5996 22.4564 17.4004 21.9732 17.9138L20.1666 19.8333M11.8333 19.8333L10.0267 17.9138C9.54351 17.4004 9.54351 16.5996 10.0267 16.0862L11.8333 14.1667'
      stroke='white'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.2'
    />
  ),
  withoutCaption: (
    <path
      d='M11.6876 23.8125L14.3126 14.1875M16.646 16.5208L18.2267 18.2004C18.6495 18.6496 18.6495 19.3503 18.2267 19.7996L16.646 21.4792M9.3543 21.4792L7.77352 19.7996C7.35072 19.3503 7.35072 18.6496 7.77352 18.2004L9.3543 16.5208'
      stroke='white'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.33333'
    />
  ),
};

const AUDIO_SYMBOLS: FileIconSymbolMap = {
  withCaption: (
    <path
      d='M20.5 15.5V18.5M22.5 14.5V19.5M13.5 19.5H10.5C10.3674 19.5 10.2402 19.4473 10.1464 19.3536C10.0527 19.2598 10 19.1326 10 19V15C10 14.8674 10.0527 14.7402 10.1464 14.6464C10.2402 14.5527 10.3674 14.5 10.5 14.5H13.5L18 11V23L13.5 19.5Z'
      stroke='white'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.2'
    />
  ),
  withoutCaption: (
    <path
      d='M17.5 17.5V20.5M19.5 16.5V21.5M10.5 21.5H7.5C7.36739 21.5 7.24021 21.4473 7.14645 21.3536C7.05268 21.2598 7 21.1326 7 21V17C7 16.8674 7.05268 16.7402 7.14645 16.6464C7.24021 16.5527 7.36739 16.5 7.5 16.5H10.5L15 13V25L10.5 21.5Z'
      stroke='white'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.33333'
    />
  ),
};

const PRESENTATION_SYMBOLS: FileIconSymbolMap = {
  withCaption: (
    <path
      d='M12.5 15.5H19.5M16 17.5V22.5M14 22.5H18M9.49999 17.5C9.41472 17.5001 9.33085 17.4783 9.25635 17.4368C9.18185 17.3953 9.1192 17.3355 9.07436 17.263C9.02952 17.1904 9.00397 17.1076 9.00014 17.0224C8.99631 16.9373 9.01433 16.8525 9.05249 16.7762L11.5525 11.7763C11.5941 11.6932 11.6579 11.6233 11.737 11.5745C11.816 11.5257 11.9071 11.4999 12 11.5H20C20.0929 11.4999 20.184 11.5257 20.263 11.5745C20.342 11.6233 20.4059 11.6932 20.4475 11.7763L22.9475 16.7762C22.9857 16.8525 23.0037 16.9373 22.9998 17.0224C22.996 17.1076 22.9705 17.1904 22.9256 17.263C22.8808 17.3355 22.8181 17.3953 22.7436 17.4368C22.6691 17.4783 22.5853 17.5001 22.5 17.5H9.49999Z'
      stroke='white'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.2'
    />
  ),
  withoutCaption: (
    <path
      d='M9.49999 17.5H16.5M13 19.5V24.5M11 24.5H15M6.49999 19.5C6.41472 19.5001 6.33085 19.4783 6.25635 19.4368C6.18185 19.3953 6.11921 19.3355 6.07436 19.263C6.02952 19.1904 6.00397 19.1076 6.00014 19.0224C5.99631 18.9373 6.01433 18.8525 6.05249 18.7763L8.55249 13.7763C8.59406 13.6932 8.65795 13.6233 8.73699 13.5745C8.81603 13.5257 8.9071 13.4999 8.99999 13.5H17C17.0929 13.4999 17.184 13.5257 17.263 13.5745C17.342 13.6233 17.4059 13.6932 17.4475 13.7763L19.9475 18.7763C19.9857 18.8525 20.0037 18.9373 19.9998 19.0224C19.996 19.1076 19.9705 19.1904 19.9256 19.263C19.8808 19.3355 19.8181 19.3953 19.7436 19.4368C19.6691 19.4783 19.5853 19.5001 19.5 19.5H6.49999Z'
      stroke='white'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.33333'
    />
  ),
};

const SPREADSHEET_SYMBOLS: FileIconSymbolMap = {
  withCaption: (
    <path
      d='M10 15.5H22M10 18.5H22M13.5 15.5V21.5M10 12.5H22V21C22 21.1326 21.9473 21.2598 21.8536 21.3536C21.7598 21.4473 21.6326 21.5 21.5 21.5H10.5C10.3674 21.5 10.2402 21.4473 10.1464 21.3536C10.0527 21.2598 10 21.1326 10 21V12.5Z'
      stroke='white'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.5'
    />
  ),
  withoutCaption: (
    <path
      d='M7 17.5H19M7 20.5H19M10.5 17.5V23.5M7 14.5H19V23C19 23.1326 18.9473 23.2598 18.8536 23.3536C18.7598 23.4473 18.6326 23.5 18.5 23.5H7.5C7.36739 23.5 7.24021 23.4473 7.14645 23.3536C7.05268 23.2598 7 23.1326 7 23V14.5Z'
      stroke='white'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.2'
    />
  ),
};

const COMPRESSION_SYMBOLS: FileIconSymbolMap = {
  withCaption: (
    <path
      clipRule='evenodd'
      d='M9.41177 0H7.52942V2H9.41177V4H7.52942V6H9.41177V8H7.52942V10H9.41177V12H7.52942V14H9.41177V12H11.2941V10H9.41177V8H11.2941V6H9.41177V4H11.2941V2H9.41177V0ZM7.52942 17C7.52942 16.4477 7.9508 16 8.4706 16H10.3529C10.8727 16 11.2941 16.4477 11.2941 17V23C11.2941 23.5523 10.8727 24 10.3529 24H8.4706C7.9508 24 7.52942 23.5523 7.52942 23V17ZM8.4706 23V20H10.3529V23H8.4706Z'
      fill='white'
      fillRule='evenodd'
    />
  ),
  withoutCaption: (
    <path
      clipRule='evenodd'
      d='M8.17031 0H6.11768V2.14737H8.17031V4.29474H6.11768V6.4421H8.17031V8.58947H6.11768V10.7368H8.17031V12.8842H6.11768V15.0316H8.17031V12.8842H10.2229V10.7368H8.17031V8.58947H10.2229V6.4421H8.17031V4.29474H10.2229V2.14737H8.17031V0ZM6.11768 18.2526C6.11768 17.6597 6.57717 17.1789 7.14399 17.1789H9.19662C9.76344 17.1789 10.2229 17.6597 10.2229 18.2526V24.6947C10.2229 25.2877 9.76344 25.7684 9.19662 25.7684H7.14399C6.57717 25.7684 6.11768 25.2877 6.11768 24.6947V18.2526ZM7.14399 24.6947V21.4737H9.19662V24.6947H7.14399Z'
      fill='white'
      fillRule='evenodd'
    />
  ),
};

const VIDEO_SYMBOLS: FileIconSymbolMap = {
  withCaption: (
    <path
      d='M20.5 16L23.5 14V20L20.5 18M10 13H20C20.2761 13 20.5 13.2239 20.5 13.5V20.5C20.5 20.7761 20.2761 21 20 21H10C9.72386 21 9.5 20.7761 9.5 20.5V13.5C9.5 13.2239 9.72386 13 10 13Z'
      stroke='white'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.2'
    />
  ),
  withoutCaption: (
    <path
      d='M17.5001 18L20.5001 16V22L17.5001 20M7.00012 15H17.0001C17.2763 15 17.5001 15.2239 17.5001 15.5V22.5C17.5001 22.7761 17.2763 23 17.0001 23H7.00012C6.72398 23 6.50012 22.7761 6.50012 22.5V15.5C6.50012 15.2239 6.72398 15 7.00012 15Z'
      stroke='white'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.33333'
    />
  ),
};

type StandardFileTypeIconProps = BaseFileIconProps & {
  color: string;
  fileTypeClassName: string;
  symbols: FileIconSymbolMap;
};

const StandardFileTypeIcon = ({
  className,
  color,
  fileTypeClassName,
  label,
  size,
  sizeConfig,
  symbols,
  ...props
}: StandardFileTypeIconProps) => {
  const renderLabel = !!label;
  const resolvedLabel = renderLabel ? label : undefined;
  const symbolVariant = renderLabel ? 'withCaption' : 'withoutCaption';

  return (
    <Svg
      {...props}
      className={clsx(fileTypeClassName, className)}
      size={size}
      sizeConfig={sizeConfig}
    >
      <g className={FILE_ICON_GRAPHIC_CLASSNAME}>
        <path d={FILE_ICON_PAPER_PATH} fill={color} />
        {renderLabel ? (
          symbols[symbolVariant]
        ) : (
          <g
            transform={`scale(${FILE_ICON_WITHOUT_CAPTION_SYMBOL_SCALE_X} ${FILE_ICON_WITHOUT_CAPTION_SYMBOL_SCALE_Y})`}
          >
            {symbols[symbolVariant]}
          </g>
        )}
        <path d={FILE_ICON_FOLD_PATH} fill='white' opacity='0.5' />
      </g>
      {resolvedLabel && (
        <FileIconLabel label={resolvedLabel} size={size} sizeConfig={sizeConfig} />
      )}
    </Svg>
  );
};

const PDF_SMALL_SYMBOL = (
  <path
    d='M20.7533 19.5337C20.28 19.037 19.3093 18.7537 17.9373 18.7537C17.204 18.7537 16.3526 18.8244 15.43 18.9897C14.8647 18.4461 14.3499 17.8523 13.892 17.2157C13.5373 16.7424 13.2293 16.2224 12.9453 15.725C13.49 14.069 13.75 12.7204 13.75 11.7504C13.75 10.6624 13.348 9.52637 12.1886 9.52637C11.834 9.52637 11.4786 9.7397 11.2893 10.047C10.7693 10.9697 11.006 12.9804 11.9046 14.9677C11.5664 15.984 11.1876 16.9863 10.7693 17.9724C10.3906 18.8717 9.96465 19.7944 9.49131 20.6457C6.88931 21.687 5.20931 22.8937 5.01998 23.839C4.94931 24.1944 5.06731 24.5257 5.32798 24.7857C5.42265 24.857 5.75398 25.141 6.32131 25.141C8.04798 25.141 9.86998 22.349 10.7926 20.6697C11.5026 20.433 12.2126 20.1964 12.922 20.007C13.6704 19.8038 14.4284 19.638 15.1933 19.5104C17.0146 21.1424 18.6233 21.403 19.428 21.403C20.4213 21.403 20.7766 21.0004 20.8946 20.6697C21.108 20.243 20.966 19.7704 20.7533 19.5337ZM19.8066 20.2204C19.7353 20.575 19.38 20.8117 18.884 20.8117C18.742 20.8117 18.624 20.7877 18.4813 20.7644C17.5826 20.551 16.7306 20.1017 15.8793 19.3917C16.5357 19.2807 17.2003 19.2254 17.866 19.2264C18.3633 19.2264 18.7893 19.2497 19.0726 19.321C19.404 19.3917 19.9246 19.605 19.806 20.2197L19.8066 20.2204ZM14.7906 19.1084C14.1305 19.2321 13.4755 19.382 12.8273 19.5577C12.262 19.7047 11.7017 19.8703 11.1473 20.0544C11.4355 19.4962 11.7039 18.9281 11.952 18.351C12.236 17.6884 12.472 17.0024 12.7093 16.3637C12.9453 16.7657 13.206 17.1684 13.466 17.523C13.8911 18.065 14.3329 18.5937 14.7906 19.1084ZM11.692 10.307C11.7338 10.2232 11.7978 10.1525 11.877 10.1025C11.9563 10.0526 12.0477 10.0253 12.1413 10.0237C12.638 10.0237 12.7326 10.591 12.7326 11.041C12.7326 11.7977 12.496 12.957 12.094 14.2817C11.4073 12.4364 11.3606 10.899 11.692 10.307ZM9.08931 21.3317C7.88265 23.319 6.72331 24.549 6.01398 24.549C5.88599 24.5498 5.76132 24.5083 5.65931 24.431C5.51731 24.289 5.44598 24.1237 5.49331 23.9344C5.63531 23.2244 7.00731 22.231 9.08931 21.3317Z'
    fill='white'
  />
);

const PDF_LEGACY_SYMBOL = (
  <>
    <path
      d='M23.7533 19.2C23.28 18.7033 22.3093 18.42 20.9373 18.42C20.204 18.42 19.3526 18.4906 18.43 18.656C17.8647 18.1124 17.3499 17.5186 16.892 16.882C16.5373 16.4086 16.2293 15.8886 15.9453 15.3913C16.49 13.7353 16.75 12.3866 16.75 11.4166C16.75 10.3286 16.348 9.19263 15.1886 9.19263C14.834 9.19263 14.4786 9.40596 14.2893 9.71329C13.7693 10.636 14.006 12.6466 14.9046 14.634C14.5664 15.6502 14.1877 16.6526 13.7693 17.6386C13.3906 18.538 12.9646 19.4606 12.4913 20.312C9.88931 21.3533 8.20931 22.56 8.01998 23.5053C7.94931 23.8606 8.06731 24.192 8.32798 24.452C8.42265 24.5233 8.75398 24.8073 9.32131 24.8073C11.048 24.8073 12.87 22.0153 13.7926 20.336C14.5026 20.0993 15.2126 19.8626 15.922 19.6733C16.6704 19.4701 17.4284 19.3043 18.1933 19.1766C20.0146 20.8086 21.6233 21.0693 22.428 21.0693C23.4213 21.0693 23.7766 20.6666 23.8946 20.336C24.108 19.9093 23.966 19.4366 23.7533 19.2ZM22.8066 19.8866C22.7353 20.2413 22.38 20.478 21.884 20.478C21.742 20.478 21.624 20.454 21.4813 20.4306C20.5826 20.2173 19.7306 19.768 18.8793 19.058C19.5357 18.947 20.2003 18.8917 20.866 18.8926C21.3633 18.8926 21.7893 18.916 22.0726 18.9873C22.404 19.058 22.9246 19.2713 22.806 19.886L22.8066 19.8866ZM17.7906 18.7746C17.1305 18.8983 16.4755 19.0482 15.8273 19.224C15.262 19.3709 14.7017 19.5366 14.1473 19.7206C14.4355 19.1625 14.7039 18.5944 14.952 18.0173C15.236 17.3546 15.472 16.6686 15.7093 16.03C15.9453 16.432 16.206 16.8346 16.466 17.1893C16.8911 17.7313 17.3329 18.26 17.7906 18.7746ZM14.692 9.97329C14.7338 9.88949 14.7978 9.81875 14.877 9.7688C14.9563 9.71884 15.0477 9.69157 15.1413 9.68996C15.638 9.68996 15.7326 10.2573 15.7326 10.7073C15.7326 11.464 15.496 12.6233 15.094 13.948C14.4073 12.1026 14.3606 10.5653 14.692 9.97329ZM12.0893 20.998C10.8826 22.9853 9.72331 24.2153 9.01398 24.2153C8.88599 24.2161 8.76132 24.1746 8.65931 24.0973C8.51731 23.9553 8.44598 23.79 8.49331 23.6006C8.63531 22.8906 10.0073 21.8973 12.0893 20.998Z'
      fill='white'
    />
    <path
      d='M9.74219 34.4258V28.6992H10.8828V29.3633H10.9531C11.0286 29.2096 11.1276 29.0781 11.25 28.9688C11.375 28.8594 11.5208 28.776 11.6875 28.7188C11.8542 28.6589 12.0391 28.6289 12.2422 28.6289C12.6016 28.6289 12.9115 28.7188 13.1719 28.8984C13.4323 29.0781 13.6328 29.3333 13.7734 29.6641C13.9167 29.9922 13.9883 30.3854 13.9883 30.8438V30.8516C13.9883 31.3125 13.918 31.7083 13.7773 32.0391C13.6367 32.3698 13.4362 32.6237 13.1758 32.8008C12.9154 32.9779 12.6042 33.0664 12.2422 33.0664C12.0443 33.0664 11.8607 33.0365 11.6914 32.9766C11.5247 32.9141 11.3776 32.8268 11.25 32.7148C11.125 32.6029 11.026 32.4688 10.9531 32.3125H10.8828V34.4258H9.74219ZM11.8516 32.1211C12.0547 32.1211 12.2279 32.0703 12.3711 31.9688C12.5169 31.8672 12.6289 31.7214 12.707 31.5312C12.7878 31.3411 12.8281 31.1146 12.8281 30.8516V30.8438C12.8281 30.5807 12.7878 30.3542 12.707 30.1641C12.6289 29.974 12.5169 29.8281 12.3711 29.7266C12.2279 29.625 12.0547 29.5742 11.8516 29.5742C11.651 29.5742 11.4766 29.625 11.3281 29.7266C11.1823 29.8281 11.069 29.974 10.9883 30.1641C10.9102 30.3516 10.8711 30.5781 10.8711 30.8438V30.8516C10.8711 31.112 10.9115 31.3385 10.9922 31.5312C11.0729 31.7214 11.1862 31.8672 11.332 31.9688C11.4805 32.0703 11.6536 32.1211 11.8516 32.1211ZM16.457 33.0664C16.1003 33.0664 15.7904 32.9779 15.5273 32.8008C15.2669 32.6211 15.0651 32.3659 14.9219 32.0352C14.7812 31.7044 14.7109 31.3099 14.7109 30.8516V30.8438C14.7109 30.3828 14.7799 29.987 14.918 29.6562C15.0586 29.3255 15.2591 29.0716 15.5195 28.8945C15.7799 28.7174 16.0924 28.6289 16.457 28.6289C16.6523 28.6289 16.8333 28.6602 17 28.7227C17.1693 28.7826 17.3177 28.8685 17.4453 28.9805C17.5729 29.0924 17.6719 29.2279 17.7422 29.3867H17.8125V27.0547H18.9531V33H17.8125V32.332H17.7422C17.6693 32.4857 17.5703 32.6172 17.4453 32.7266C17.3229 32.8359 17.1784 32.9206 17.0117 32.9805C16.8451 33.0378 16.6602 33.0664 16.457 33.0664ZM16.8438 32.1211C17.0469 32.1211 17.2214 32.0703 17.3672 31.9688C17.513 31.8672 17.625 31.7214 17.7031 31.5312C17.7839 31.3411 17.8242 31.1159 17.8242 30.8555V30.8477C17.8242 30.582 17.7839 30.3555 17.7031 30.168C17.625 29.9779 17.5117 29.832 17.3633 29.7305C17.2174 29.6263 17.0443 29.5742 16.8438 29.5742C16.6458 29.5742 16.4727 29.6263 16.3242 29.7305C16.1784 29.832 16.0664 29.9779 15.9883 30.168C15.9102 30.3555 15.8711 30.5807 15.8711 30.8438V30.8516C15.8711 31.1146 15.9102 31.3411 15.9883 31.5312C16.0664 31.7214 16.1784 31.8672 16.3242 31.9688C16.4701 32.0703 16.6432 32.1211 16.8438 32.1211ZM20.4648 33V29.5586H19.7695V28.6992H20.4648V28.2969C20.4648 28.0104 20.5156 27.7721 20.6172 27.582C20.7188 27.3919 20.8776 27.25 21.0938 27.1562C21.3125 27.0599 21.5951 27.0117 21.9414 27.0117C22.0586 27.0117 22.1641 27.0156 22.2578 27.0234C22.3542 27.0312 22.444 27.0417 22.5273 27.0547V27.8164C22.4909 27.8086 22.4427 27.8034 22.3828 27.8008C22.3255 27.7956 22.2604 27.793 22.1875 27.793C21.9661 27.793 21.8099 27.8438 21.7188 27.9453C21.6276 28.0443 21.582 28.1875 21.582 28.375V28.6992H22.4922V29.5586H21.6055V33H20.4648Z'
      fill='white'
    />
  </>
);

export const FilePdfIcon = ({
  className,
  label,
  size,
  sizeConfig,
  ...props
}: BaseFileIconProps) => {
  const useLegacyPdfMarkup = !!label;

  return (
    <Svg
      {...props}
      className={clsx(
        'str-chat__file-icon--pdf',
        useLegacyPdfMarkup && FILE_ICON_NO_LABEL_CLASSNAME,
        className,
      )}
      size={size}
      sizeConfig={sizeConfig}
    >
      <g className={FILE_ICON_GRAPHIC_CLASSNAME}>
        <path d={FILE_ICON_PAPER_PATH} fill='#E71A01' />
        {useLegacyPdfMarkup ? (
          PDF_LEGACY_SYMBOL
        ) : (
          <g
            transform={`scale(${FILE_ICON_WITHOUT_CAPTION_SYMBOL_SCALE_X} ${FILE_ICON_WITHOUT_CAPTION_SYMBOL_SCALE_Y})`}
          >
            {PDF_SMALL_SYMBOL}
          </g>
        )}
        <path d={FILE_ICON_FOLD_PATH} fill='white' opacity='0.5' />
      </g>
    </Svg>
  );
};

export const FileWordIcon = ({ className, label, ...props }: BaseFileIconProps) => (
  <StandardFileTypeIcon
    {...props}
    className={className}
    color='#3375E2'
    fileTypeClassName='str-chat__file-icon--doc'
    label={label}
    symbols={TEXT_SYMBOLS}
  />
);

export const FilePowerPointIcon = ({ className, label, ...props }: BaseFileIconProps) => (
  <StandardFileTypeIcon
    {...props}
    className={className}
    color='#D14423'
    fileTypeClassName='str-chat__file-icon--ppt'
    label={label}
    symbols={PRESENTATION_SYMBOLS}
  />
);

export const FileExcelIcon = ({ className = '', label, ...props }: BaseFileIconProps) => (
  <StandardFileTypeIcon
    {...props}
    className={className}
    color='#0C864B'
    fileTypeClassName='str-chat__file-icon--xls'
    label={label}
    symbols={SPREADSHEET_SYMBOLS}
  />
);

export const FileArchiveIcon = ({
  className = '',
  label = '',
  ...props
}: BaseFileIconProps) => (
  <StandardFileTypeIcon
    {...props}
    className={className}
    color='#E59E34'
    fileTypeClassName='str-chat__file-icon--compressed'
    label={label}
    symbols={COMPRESSION_SYMBOLS}
  />
);

export const FileCodeIcon = ({ className = '', label, ...props }: BaseFileIconProps) => (
  <StandardFileTypeIcon
    {...props}
    className={className}
    color='#00ACA1'
    fileTypeClassName='str-chat__file-icon--code'
    label={label}
    symbols={CODE_SYMBOLS}
  />
);

export const FileAudioIcon = ({ className = '', label, ...props }: BaseFileIconProps) => (
  <StandardFileTypeIcon
    {...props}
    className={className}
    color='#2727B0'
    fileTypeClassName='str-chat__file-icon--audio'
    label={label}
    symbols={AUDIO_SYMBOLS}
  />
);

export const FileVideoIcon = ({ className = '', label, ...props }: BaseFileIconProps) => (
  <StandardFileTypeIcon
    {...props}
    className={className}
    color='#A847B7'
    fileTypeClassName='str-chat__file-icon--video'
    label={label}
    symbols={VIDEO_SYMBOLS}
  />
);

export const FileFallbackIcon = ({
  className = '',
  label = '',
  ...props
}: BaseFileIconProps) => (
  <StandardFileTypeIcon
    {...props}
    className={className}
    color='#888888'
    fileTypeClassName='str-chat__file-icon--other'
    label={label}
    symbols={OTHER_SYMBOLS}
  />
);
