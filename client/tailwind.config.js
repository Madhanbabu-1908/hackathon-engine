/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // TCS GenAI Lab design system
        'lab-black':  '#050810',
        'lab-navy':   '#0a1628',
        'lab-teal':   '#00d4c8',
        'lab-gold':   '#f0a500',
        'lab-purple': '#7c3aed',
        'lab-red':    '#ff3b5c',
        'lab-green':  '#00e676',
      },
      fontFamily: {
        display: ['"Rajdhani"', 'sans-serif'],
        body:    ['"Exo 2"', 'sans-serif'],
        mono:    ['"Share Tech Mono"', 'monospace'],
      },
      boxShadow: {
        'teal-glow':   '0 0 20px rgba(0, 212, 200, 0.5)',
        'gold-glow':   '0 0 20px rgba(240, 165, 0, 0.5)',
        'red-glow':    '0 0 20px rgba(255, 59, 92, 0.5)',
        'purple-glow': '0 0 20px rgba(124, 58, 237, 0.5)',
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-teal':    'glowTeal 2s ease-in-out infinite alternate',
        'glow-gold':    'glowGold 2s ease-in-out infinite alternate',
        'count-urgent': 'countUrgent 0.5s ease-in-out infinite alternate',
        'float':        'float 6s ease-in-out infinite',
      },
      keyframes: {
        glowTeal: {
          '0%':   { textShadow: '0 0 10px rgba(0,212,200,0.5)' },
          '100%': { textShadow: '0 0 30px rgba(0,212,200,1), 0 0 60px rgba(0,212,200,0.5)' },
        },
        glowGold: {
          '0%':   { textShadow: '0 0 10px rgba(240,165,0,0.5)' },
          '100%': { textShadow: '0 0 30px rgba(240,165,0,1), 0 0 60px rgba(240,165,0,0.5)' },
        },
        countUrgent: {
          '0%':   { color: '#ff3b5c', transform: 'scale(1)' },
          '100%': { color: '#ff8c00', transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
