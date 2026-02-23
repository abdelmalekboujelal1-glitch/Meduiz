export interface Theme {
  id: string;
  name: string;
  colors: {
    bg: string;
    card: string;
    border: string;
    accent: string;
    accentDark: string;
    text: string;
    textMuted: string;
    textDim: string;
    input: string;
    danger: string;
    warning: string;
  };
}

export const THEMES: Theme[] = [
  {
    id: 'forest',
    name: 'Forêt Sombre',
    colors: {
      bg: '#0a1a0f',
      card: '#0f2317',
      border: '#1a3d25',
      accent: '#00e676',
      accentDark: '#00b85e',
      text: '#e8f5e9',
      textMuted: '#6daa80',
      textDim: '#3d6b4d',
      input: '#081508',
      danger: '#ff5252',
      warning: '#ffab40',
    }
  },
  {
    id: 'ocean',
    name: 'Océan Profond',
    colors: {
      bg: '#0a111a',
      card: '#0f1a23',
      border: '#1a2d3d',
      accent: '#00b0ff',
      accentDark: '#0091ea',
      text: '#e1f5fe',
      textMuted: '#548ca8',
      textDim: '#2c5266',
      input: '#081018',
      danger: '#ff5252',
      warning: '#ffab40',
    }
  },
  {
    id: 'sunset',
    name: 'Coucher de Soleil',
    colors: {
      bg: '#1a0f0a',
      card: '#23150f',
      border: '#3d251a',
      accent: '#ff6d00',
      accentDark: '#e65100',
      text: '#fff3e0',
      textMuted: '#a87654',
      textDim: '#66422c',
      input: '#150a08',
      danger: '#ff5252',
      warning: '#ffab40',
    }
  },
  {
    id: 'berry',
    name: 'Baies Sauvages',
    colors: {
      bg: '#1a0a15',
      card: '#230f1d',
      border: '#3d1a32',
      accent: '#d500f9',
      accentDark: '#aa00ff',
      text: '#f3e5f5',
      textMuted: '#a85496',
      textDim: '#662c5a',
      input: '#150811',
      danger: '#ff5252',
      warning: '#ffab40',
    }
  },
  {
    id: 'midnight',
    name: 'Minuit',
    colors: {
      bg: '#000000',
      card: '#121212',
      border: '#333333',
      accent: '#ffffff',
      accentDark: '#e0e0e0',
      text: '#ffffff',
      textMuted: '#888888',
      textDim: '#555555',
      input: '#0a0a0a',
      danger: '#ff5252',
      warning: '#ffab40',
    }
  }
];
