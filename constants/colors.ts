// Color palette from the provided image
export const Colors = {
  // Primary colors from the palette
  umber: '#685951',
  cinereous: '#867A74', 
  taupeGray: '#A49B97',
  platinum: '#E1DEDC',
  berkeleyBlue: '#1D3557',
  
  // Semantic colors
  background: '#A49B97', // Main app background using taupeGray
  surface: '#E1DEDC',
  text: {
    primary: '#1D3557',
    secondary: '#685951',
    muted: '#867A74',
    light: '#A49B97'
  },
  accent: {
    primary: '#1D3557',
    secondary: '#685951'
  },
  border: '#E1DEDC',
  shadow: 'rgba(29, 53, 87, 0.1)'
} as const;

export default Colors;