import { useEffect } from 'react';

export const useCustomStyles = (customStyles: Record<string, unknown> | undefined) => {
  useEffect(() => {
    if (customStyles) {
      //@ts-expect-error
      const handleThemeUpdate = (variables) => {
        const root = document.documentElement;
        const keys = Object.keys(variables);
        keys.forEach((key) => {
          root.style.setProperty(key, variables[key]);
        });
      };
      handleThemeUpdate(customStyles);
    }
  }, [customStyles]);
};
