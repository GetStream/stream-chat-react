export const useCustomStyles = (styleObject: { [key: string]: string }) => {
  for (const [key, value] of Object.entries(styleObject)) {
    document.documentElement.style.setProperty(key, value);
  }
};

export const darkModeTheme = {
  '--bg-gradient-end': '#101214',
  '--bg-gradient-start': '#070a0d',
  '--black': '#ffffff',
  '--blue-alice': '#00193d',
  '--border': '#141924',
  '--button-background': '#ffffff',
  '--button-text': '#005fff',
  '--grey': '#7a7a7a',
  '--grey-gainsboro': '#2d2f2f',
  '--grey-whisper': '#1c1e22',
  '--icon-background': '#ffffff',
  '--modal-shadow': '#000000',
  '--overlay': '#00000066', // 66 = 40% opacity
  '--overlay-dark': '#ffffffcc', // CC = 80% opacity
  '--shadow-icon': '#00000080', // 80 = 50% opacity
  '--targetedMessageBackground': '#302d22',
  '--transparent': 'transparent',
  '--white': '#101418',
  '--white-smoke': '#13151b',
  '--white-snow': '#070a0d',
};
