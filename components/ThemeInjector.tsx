import React, { useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { ThemeColorSet } from '../types';

const ThemeInjector: React.FC = () => {
  const { data } = useData();

  useEffect(() => {
    if (!data?.themeColors) return;

    const { light, dark } = data.themeColors;

    const createCssVariables = (themeSet: ThemeColorSet) => {
      return Object.entries(themeSet)
        .map(([key, value]) => `--${key.replace(/_/g, '-')}: ${value};`)
        .join('\n');
    };

    const lightThemeCss = createCssVariables(light);
    const darkThemeCss = createCssVariables(dark);

    const styleContent = `
      :root {
        ${lightThemeCss}
      }
      html.dark {
        ${darkThemeCss}
      }
    `;

    const styleElementId = 'dynamic-theme-styles';
    let styleElement = document.getElementById(styleElementId) as HTMLStyleElement | null;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleElementId;
      document.head.appendChild(styleElement);
    }

    styleElement.innerHTML = styleContent;

  }, [data?.themeColors]);

  return null; // This component does not render anything
};

export default ThemeInjector;
