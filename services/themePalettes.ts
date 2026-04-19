import { ThemeColorSet } from '../types';

interface Palette {
  name: string;
  light: ThemeColorSet;
  dark: ThemeColorSet;
}

export const palettes: Palette[] = [
  {
    name: 'DCCC Default',
    light: {
      background: '#f8fafc',
      text_primary: '#0f172a',
      text_secondary: '#475569',
      accent: '#3b82f6',
      accent_hover: '#2563eb',
      accent_text: '#ffffff',
      card_bg: 'rgba(255, 255, 255, 0.6)',
      border_color: 'rgba(0, 0, 0, 0.1)',
    },
    dark: {
      background: '#0f172a',
      text_primary: '#e2e8f0',
      text_secondary: '#94a3b8',
      accent: '#3b82f6',
      accent_hover: '#60a5fa',
      accent_text: '#ffffff',
      card_bg: 'rgba(30, 41, 59, 0.5)',
      border_color: 'rgba(255, 255, 255, 0.1)',
    },
  },
  {
    name: 'Crimson Night',
    light: {
      background: '#fef2f2',
      text_primary: '#1f2937',
      text_secondary: '#6b7280',
      accent: '#dc2626',
      accent_hover: '#b91c1c',
      accent_text: '#ffffff',
      card_bg: 'rgba(255, 255, 255, 0.7)',
      border_color: 'rgba(220, 38, 38, 0.1)',
    },
    dark: {
      background: '#1f2937',
      text_primary: '#f9fafb',
      text_secondary: '#d1d5db',
      accent: '#ef4444',
      accent_hover: '#f87171',
      accent_text: '#ffffff',
      card_bg: 'rgba(55, 65, 81, 0.5)',
      border_color: 'rgba(239, 68, 68, 0.2)',
    },
  },
  {
    name: 'Forest Green',
    light: {
      background: '#f0fdf4',
      text_primary: '#1f2937',
      text_secondary: '#4b5563',
      accent: '#16a34a',
      accent_hover: '#15803d',
      accent_text: '#ffffff',
      card_bg: 'rgba(255, 255, 255, 0.7)',
      border_color: 'rgba(22, 163, 74, 0.1)',
    },
    dark: {
      background: '#132a13',
      text_primary: '#ecfdf5',
      text_secondary: '#a3b899',
      accent: '#22c55e',
      accent_hover: '#4ade80',
      accent_text: '#052e16',
      card_bg: 'rgba(22, 101, 52, 0.3)',
      border_color: 'rgba(34, 197, 94, 0.2)',
    },
  },
  {
    name: 'Royal Purple',
    light: {
      background: '#faf5ff',
      text_primary: '#1e293b',
      text_secondary: '#475569',
      accent: '#9333ea',
      accent_hover: '#7e22ce',
      accent_text: '#ffffff',
      card_bg: 'rgba(255, 255, 255, 0.7)',
      border_color: 'rgba(147, 51, 234, 0.1)',
    },
    dark: {
      background: '#28203e',
      text_primary: '#f5f3ff',
      text_secondary: '#c4b5fd',
      accent: '#a855f7',
      accent_hover: '#c084fc',
      accent_text: '#ffffff',
      card_bg: 'rgba(67, 56, 202, 0.2)',
      border_color: 'rgba(168, 85, 247, 0.2)',
    },
  },
  {
    name: 'Golden Hour',
    light: {
        background: '#fffbeb',
        text_primary: '#374151',
        text_secondary: '#6b7280',
        accent: '#f59e0b',
        accent_hover: '#d97706',
        accent_text: '#ffffff',
        card_bg: 'rgba(255, 251, 235, 0.8)',
        border_color: 'rgba(245, 158, 11, 0.2)',
    },
    dark: {
        background: '#2c1d0f',
        text_primary: '#fef3c7',
        text_secondary: '#fde68a',
        accent: '#fbbf24',
        accent_hover: '#fcd34d',
        accent_text: '#422006',
        card_bg: 'rgba(54, 34, 4, 0.5)',
        border_color: 'rgba(251, 191, 36, 0.2)',
    }
  },
  {
      name: 'Oceanic Teal',
      light: {
          background: '#ecfeff',
          text_primary: '#1f2937',
          text_secondary: '#4b5563',
          accent: '#0d9488',
          accent_hover: '#0f766e',
          accent_text: '#ffffff',
          card_bg: 'rgba(236, 254, 255, 0.8)',
          border_color: 'rgba(13, 148, 136, 0.2)',
      },
      dark: {
          background: '#042f2e',
          text_primary: '#f0fdfa',
          text_secondary: '#99f6e4',
          accent: '#2dd4bf',
          accent_hover: '#5eead4',
          accent_text: '#042f2e',
          card_bg: 'rgba(19, 78, 74, 0.4)',
          border_color: 'rgba(45, 212, 191, 0.2)',
      }
  }
];
