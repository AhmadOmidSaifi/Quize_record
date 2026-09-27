module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0A0F1D',
          panel: '#111A2C',
          raised: '#16213A',
          line: '#233156',
        },
        signal: {
          DEFAULT: '#FFB020',
          soft: '#FFCB6B',
          dim: '#4A3A18',
        },
        teal: {
          DEFAULT: '#2DD4BF',
        },
        coral: {
          DEFAULT: '#FB5D5D',
        },
        ice: {
          DEFAULT: '#E7ECF5',
          dim: '#8592AD',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 20px 40px -20px rgba(0,0,0,0.5)',
        glow: '0 0 0 1px rgba(255,176,32,0.4), 0 0 24px rgba(255,176,32,0.25)',
      },
      keyframes: {
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(255,176,32,0.45)' },
          '100%': { boxShadow: '0 0 0 10px rgba(255,176,32,0)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        pulseRing: 'pulseRing 1.6s cubic-bezier(0.4,0,0.6,1) infinite',
        rise: 'rise 0.35s ease-out both',
        popIn: 'popIn 0.25s ease-out both',
      },
    },
  },
  plugins: [],
}
